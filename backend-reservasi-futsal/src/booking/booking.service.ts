import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UploadPaymentProofDto, CancelBookingDto } from './dto/update-booking.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../common/logger.service';
import { normalizeAssetUrl } from '../common/network.util';
import { BookingStatus, DayType, PaymentStatus } from '@prisma/client';
import { EmailService } from '../common/email.service';

function getWibHour(date: Date): number {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000).getUTCHours();
}

function getDayType(date: Date): DayType {
  const day = new Date(date.getTime() + 7 * 60 * 60 * 1000).getUTCDay();
  return day === 0 || day === 6 ? DayType.WEEKEND : DayType.WEEKDAY;
}

function getOperationalWindow(openingHours: { dayType: DayType; startHour: number; endHour: number }[], dayType: DayType) {
  return (
    openingHours.find((item) => item.dayType === dayType) || {
      dayType,
      startHour: 6,
      endHour: 24,
    }
  );
}

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private emailService: EmailService,
  ) {}

  private normalizeBookingResponse(booking: any, assetBaseUrl?: string) {
    return {
      ...booking,
      field: booking.field
        ? {
            ...booking.field,
            images: Array.isArray(booking.field.images)
              ? booking.field.images.map((img: any) => ({
                  ...img,
                  imageUrl: normalizeAssetUrl(img.imageUrl, assetBaseUrl) ?? img.imageUrl,
                }))
              : booking.field.images,
          }
        : booking.field,
      payment: booking.payment
        ? {
            ...booking.payment,
            proofUrl: normalizeAssetUrl(booking.payment.proofUrl, assetBaseUrl) ?? booking.payment.proofUrl,
          }
        : booking.payment,
      primaryImage: normalizeAssetUrl(booking.primaryImage, assetBaseUrl) ?? booking.primaryImage,
    };
  }

  async create(dto: { customerId: string; fieldId: string; startTime: string; endTime: string; proofUrl?: string; isDp?: boolean; assetBaseUrl?: string }) {
    const { customerId, fieldId, startTime, endTime, proofUrl, isDp = false, assetBaseUrl } = dto;
    const normalizedProofUrl = normalizeAssetUrl(proofUrl, assetBaseUrl) ?? proofUrl;

    // Validasi customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer tidak ditemukan');
    }

    // Validasi field exists dan active
    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
      include: {
        openingHours: true,
      },
    });

    if (!field) {
      throw new NotFoundException('Lapangan tidak ditemukan');
    }

    if (!field.isActive) {
      throw new BadRequestException('Lapangan sedang tidak aktif');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validasi waktu
    if (end <= start) {
      throw new BadRequestException('Waktu selesai harus lebih besar dari waktu mulai');
    }

    const slotHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (!Number.isInteger(slotHours) || slotHours <= 0) {
      throw new BadRequestException('Durasi booking harus dalam kelipatan 1 jam');
    }

    const startHour = getWibHour(start);
    const dayType = getDayType(start);
    const operationalHour = getOperationalWindow(field.openingHours, dayType);

    if (
      startHour < operationalHour.startHour ||
      startHour + slotHours > operationalHour.endHour
    ) {
      throw new BadRequestException(
        `Jam operasional lapangan untuk ${dayType} adalah pukul ${String(operationalHour.startHour).padStart(2, '0')}:00 hingga ${String(operationalHour.endHour).padStart(2, '0')}:00 WIB. Lapangan tidak dapat dipesan di luar jam tersebut.`
      );
    }

    // Customer lead time check: minimal 30 menit sebelum bermain
    const thirtyMinutesFromNow = new Date();
    thirtyMinutesFromNow.setMinutes(thirtyMinutesFromNow.getMinutes() + 30);

    if (start < thirtyMinutesFromNow) {
      throw new BadRequestException(
        'Pemesanan online minimal dilakukan 30 menit sebelum waktu bermain. Jika Anda ingin segera bermain, Anda dapat datang langsung (walk-in) dan memesan lewat kasir.'
      );
    }

    // Cek apakah slot waktu tersedia
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        fieldId,
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.PAID,
          ],
        },
        OR: [
          {
            AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }],
          },
          {
            AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }],
          },
          {
            AND: [{ startTime: { gte: start } }, { endTime: { lte: end } }],
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw new BadRequestException(
        'Slot waktu ini sudah dibooking. Silakan pilih waktu lain.',
      );
    }

    // Hitung harga
    const totalPrice = await this.calculatePrice(fieldId, start, end);

    // Tentukan status awal booking
    const initialStatus = BookingStatus.PENDING;

    const dpAmount = isDp ? Math.round(totalPrice * 0.5) : 0;

    // Buat booking dengan payment (jika ada proofUrl)
    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        fieldId,
        startTime: start,
        endTime: end,
        totalPrice,
        isDp,
        dpAmount,
        paidAmount: 0,
        status: initialStatus,
        ...(normalizedProofUrl
          ? {
              payment: {
                create: {
                  proofUrl: normalizedProofUrl,
                  status: PaymentStatus.WAITING_VERIFICATION,
                },
              },
            }
          : {}),
      },
      include: {
        field: {
          select: {
            id: true,
            name: true,
            type: true,
            lengthMeter: true,
            widthMeter: true,
            images: {
              where: { isPrimary: true },
              select: { imageUrl: true },
              take: 1,
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payment: {
          select: {
            id: true,
            proofUrl: true,
            status: true,
          },
        },
      },
    });

    const logMessage = normalizedProofUrl
      ? `Booking created with payment proof: ${booking.id} by customer ${customer.name}`
      : `Booking created: ${booking.id} by customer ${customer.name}`;

    this.logger.log(logMessage, 'BookingService');

    // Kirim notifikasi email "Booking Dibuat"
    this.emailService.sendBookingCreated(
      customer.email,
      customer.name,
      {
        bookingId: booking.id,
        fieldName: booking.field.name,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalPrice: booking.totalPrice,
        isDp: booking.isDp,
        dpAmount: booking.dpAmount,
      }
    ).catch(err => {
      this.logger.error(`Gagal mengirim email booking dibuat: ${err.message}`, err.stack, 'BookingService');
    });

    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const bookingNumber = this.generateBookingNumber(booking.createdAt);
    const displayStatus = this.getDisplayStatus(booking.status);

    return {
      message: 'Booking berhasil dibuat',
      data: {
        ...this.normalizeBookingResponse(booking, assetBaseUrl),
        bookingNumber,
        displayStatus,
        durationHours,
        fieldName: booking.field.name,
      },
    };
  }

  private async calculatePrice(
    fieldId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<number> {
    // Ambil semua harga untuk field ini
    const prices = await this.prisma.fieldPrice.findMany({
      where: { fieldId },
    });

    if (prices.length === 0) {
      throw new BadRequestException(
        'Lapangan ini belum memiliki konfigurasi harga',
      );
    }

    let totalPrice = 0;
    const currentDate = new Date(startTime);

    while (currentDate < endTime) {
      const nextHour = new Date(currentDate.getTime() + 60 * 60 * 1000);

      const endOfSlot = nextHour > endTime ? endTime : nextHour;
      const duration = (endOfSlot.getTime() - currentDate.getTime()) / (1000 * 60 * 60);

      // Convert to Jakarta time (UTC+7)
      const targetTime = new Date(currentDate.getTime() + 7 * 60 * 60 * 1000);
      const dayOfWeek = targetTime.getUTCDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayType = isWeekend ? 'WEEKEND' : 'WEEKDAY';
      const hour = targetTime.getUTCHours();

      // Cari harga yang sesuai
      const applicablePrice = prices.find(
        (p) =>
          p.dayType === dayType &&
          p.startHour <= hour &&
          p.endHour > hour,
      );

      if (!applicablePrice) {
        throw new BadRequestException(
          `Tidak ada harga yang tersedia untuk ${dayType} jam ${hour}:00`,
        );
      }

      totalPrice += applicablePrice.price * duration;
      currentDate.setTime(endOfSlot.getTime());
    }

    return Math.round(totalPrice);
  }

  async getMyBookings(customerId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
    assetBaseUrl?: string;
  }) {
    const { status, page = 1, limit = 20, assetBaseUrl } = params || {};
    const skip = (page - 1) * limit;

    const where: any = {
      customerId,
      ...(status ? { status: status as BookingStatus } : {}),
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          field: {
            select: {
              id: true,
              name: true,
              type: true,
              images: {
                where: { isPrimary: true },
                select: { imageUrl: true },
                take: 1,
              },
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              proofUrl: true,
              verifiedAt: true,
              note: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    const bookingsWithDetails = bookings.map((booking) => {
      const durationHours =
        (new Date(booking.endTime).getTime() -
          new Date(booking.startTime).getTime()) /
        (1000 * 60 * 60);

      // Generate booking number dari timestamp
      const bookingNumber = this.generateBookingNumber(booking.createdAt);

      // Map status untuk mobile app
      const displayStatus = this.getDisplayStatus(booking.status);

      return {
        id: booking.id,
        bookingNumber,
        fieldName: booking.field.name,
        status: displayStatus,
        date: booking.startTime,
        startTime: booking.startTime,
        durationHours,
      };
    });

    return {
      message: 'Daftar booking berhasil diambil',
      data: bookingsWithDetails,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private generateBookingNumber(createdAt: Date): string {
    // Format: #YYMMDD + urutan dari timestamp
    const date = new Date(createdAt);
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const seq = String(date.getTime()).slice(-4);
    
    return `#${yy}${mm}${dd}${seq}`;
  }

  private getDisplayStatus(status: BookingStatus): {
    label: string;
    color: string;
  } {
    const statusMap = {
      [BookingStatus.PAID]: { label: 'Approved', color: 'success' },
      [BookingStatus.PENDING]: { label: 'Pending', color: 'warning' },
      [BookingStatus.WAITING_PAYMENT]: { label: 'Pending', color: 'warning' },
      [BookingStatus.CANCELLED]: { label: 'Cancelled', color: 'danger' },
      [BookingStatus.COMPLETED]: { label: 'Completed', color: 'info' },
    };

    return statusMap[status] || { label: status, color: 'default' };
  }

  async findOne(id: string, customerId?: string, assetBaseUrl?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        field: {
          select: {
            id: true,
            name: true,
            type: true,
            lengthMeter: true,
            widthMeter: true,
            images: {
              orderBy: [
                { isPrimary: 'desc' },
                { order: 'asc' },
              ],
              select: {
                imageUrl: true,
                isPrimary: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payment: {
          select: {
            id: true,
            proofUrl: true,
            status: true,
            verifiedAt: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (customerId && booking.customerId !== customerId) {
      throw new BadRequestException('Anda tidak memiliki akses ke booking ini');
    }

    const durationHours =
      (new Date(booking.endTime).getTime() -
        new Date(booking.startTime).getTime()) /
      (1000 * 60 * 60);

    const bookingNumber = this.generateBookingNumber(booking.createdAt);
    const displayStatus = this.getDisplayStatus(booking.status);

    return {
      message: 'Detail booking berhasil diambil',
      data: {
        ...this.normalizeBookingResponse(booking, assetBaseUrl),
        bookingNumber,
        displayStatus,
        durationHours,
        fieldName: booking.field.name,
      },
    };
  }

  async uploadPaymentProof(bookingId: string, customerId: string, dto: UploadPaymentProofDto & { assetBaseUrl?: string }) {
    const { assetBaseUrl, proofUrl } = dto;
    const normalizedProofUrl = normalizeAssetUrl(proofUrl, assetBaseUrl) ?? proofUrl;
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (booking.customerId !== customerId) {
      throw new BadRequestException('Anda tidak memiliki akses ke booking ini');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking sudah dibatalkan');
    }

    if (booking.status === BookingStatus.PAID) {
      throw new BadRequestException('Booking sudah dibayar dan diverifikasi');
    }

    // Jika sudah ada payment, update. Jika belum, create
    let payment;
    if (booking.payment) {
      payment = await this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          proofUrl: normalizedProofUrl,
          status: PaymentStatus.WAITING_VERIFICATION,
        },
      });
    } else {
      payment = await this.prisma.payment.create({
        data: {
          bookingId,
          proofUrl: normalizedProofUrl,
          status: PaymentStatus.WAITING_VERIFICATION,
        },
      });
    }

    // Update status booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.WAITING_PAYMENT },
      include: {
        field: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `Payment proof uploaded for booking ${bookingId}`,
      'BookingService',
    );

    return {
      message: 'Bukti pembayaran berhasil diupload',
      data: {
        booking: updatedBooking,
        payment: {
          ...payment,
          proofUrl: normalizeAssetUrl(payment.proofUrl, assetBaseUrl) ?? payment.proofUrl,
        },
      },
    };
  }

  async cancelBooking(bookingId: string, customerId: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (booking.customerId !== customerId) {
      throw new BadRequestException('Anda tidak memiliki akses ke booking ini');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking sudah dibatalkan sebelumnya');
    }

    if (booking.status === BookingStatus.PAID) {
      throw new BadRequestException(
        'Booking yang sudah dibayar tidak dapat dibatalkan. Silakan hubungi admin.',
      );
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking yang sudah selesai tidak dapat dibatalkan');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
      include: {
        field: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `Booking ${bookingId} cancelled by customer. Reason: ${dto.reason}`,
      'BookingService',
    );

    return {
      message: 'Booking berhasil dibatalkan',
      data: updatedBooking,
    };
  }
}
