import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../../common/logger.service';
import { EmailService } from '../../common/email.service';
import { VerifyPaymentDto } from './dto';
import { BookingStatus, DayType, PaymentStatus } from '@prisma/client';

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
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private emailService: EmailService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    fieldId?: string;
    venueId?: string;
    startDate?: string;
    endDate?: string;
    today?: boolean;
  }) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      fieldId,
      venueId,
      today = false,
    } = params;

    let { startDate, endDate } = params as {
      startDate?: string;
      endDate?: string;
    };

    const skip = (page - 1) * limit;

    // If today flag is provided, compute today's range and override startDate/endDate
    if (today) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const tomorrow = new Date(todayDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      // override startDate and endDate
      startDate = todayDate.toISOString();
      endDate = tomorrow.toISOString();
    }

    const where: any = {
      ...(fieldId ? { fieldId } : {}),
      ...(status ? { status: status as BookingStatus } : {}),
      ...(venueId ? { field: { venueId } } : {}),
      ...(startDate || endDate
        ? {
            startTime: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search } },
              { customer: { name: { contains: search } } },
              { customer: { email: { contains: search } } },
              { field: { name: { contains: search } } },
              { field: { venue: { name: { contains: search } } } },
            ],
          }
        : {}),
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          field: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          payment: {
            select: {
              id: true,
              proofUrl: true,
              status: true,
              verifiedAt: true,
              verifiedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
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

    return {
      message: 'Daftar booking berhasil diambil',
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        field: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        payment: {
          select: {
            id: true,
            proofUrl: true,
            status: true,
            verifiedAt: true,
            verifiedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            note: true,
            createdAt: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking dengan ID "${id}" tidak ditemukan`);
    }

    return {
      message: 'Detail booking berhasil diambil',
      data: booking,
    };
  }

  async getPendingVerification(params: {
    page?: number;
    limit?: number;
    venueId?: string;
  }) {
    const { page = 1, limit = 10, venueId } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      payment: {
        status: PaymentStatus.WAITING_VERIFICATION,
      },
      ...(venueId ? { field: { venueId } } : {}),
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          field: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          payment: {
            select: {
              id: true,
              proofUrl: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      message: 'Daftar booking menunggu verifikasi berhasil diambil',
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async verifyPayment(
    bookingId: string,
    dto: VerifyPaymentDto,
    adminId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        customer: {
          select: { name: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(
        `Booking dengan ID "${bookingId}" tidak ditemukan`,
      );
    }

    if (!booking.payment) {
      throw new BadRequestException('Booking ini belum memiliki data payment');
    }

    if (booking.payment.status !== PaymentStatus.WAITING_VERIFICATION) {
      throw new BadRequestException(
        `Payment sudah diverifikasi dengan status: ${booking.payment.status}`,
      );
    }

    const { approved, note } = dto;

    const newPaymentStatus = approved
      ? PaymentStatus.APPROVED
      : PaymentStatus.REJECTED;

    const newBookingStatus = approved
      ? BookingStatus.PAID
      : BookingStatus.CANCELLED;

    const [updatedPayment, updatedBooking] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: newPaymentStatus,
          verifiedById: adminId,
          verifiedAt: new Date(),
          note: note || null,
        },
        include: {
          verifiedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: newBookingStatus,
          ...(approved ? { paidAmount: booking.isDp ? booking.dpAmount : booking.totalPrice } : {}),
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          field: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    this.logger.log(
      `Payment ${approved ? 'approved' : 'rejected'} for booking ${bookingId} by admin ${adminId}`,
      'BookingsService',
    );

    // Send email notification to customer
    const emailDetails = {
      bookingId: updatedBooking.id,
      fieldName: updatedBooking.field.name,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPrice: booking.totalPrice,
      isDp: booking.isDp,
      dpAmount: booking.dpAmount,
      paidAmount: updatedBooking.paidAmount,
      rejectionNote: note,
    };

    if (approved) {
      this.emailService.sendBookingApproved(
        updatedBooking.customer.email,
        updatedBooking.customer.name,
        emailDetails,
      ).catch((err) => {
        this.logger.error(`Failed to send approval email: ${err.message}`, err.stack, 'BookingsService');
      });
    } else {
      this.emailService.sendBookingRejected(
        updatedBooking.customer.email,
        updatedBooking.customer.name,
        emailDetails,
      ).catch((err) => {
        this.logger.error(`Failed to send rejection email: ${err.message}`, err.stack, 'BookingsService');
      });
    }

    return {
      message: `Payment berhasil ${approved ? 'disetujui' : 'ditolak'}`,
      data: {
        booking: updatedBooking,
        payment: updatedPayment,
      },
    };
  }

  async getStats(venueId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1,
    );

    const [
      todayBookingsCount,
      activeBookingsCount,
      monthlyRevenue,
      pendingVerificationCount,
    ] = await Promise.all([
      // Pesanan hari ini
      this.prisma.booking.count({
        where: {
          startTime: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      // Pesanan aktif (PAID atau WAITING_PAYMENT)
      this.prisma.booking.count({
        where: {
          status: {
            in: [BookingStatus.PAID, BookingStatus.WAITING_PAYMENT],
          },
        },
      }),
      // Pendapatan bulan ini (hanya yang PAID)
      this.prisma.booking.aggregate({
        where: {
          status: BookingStatus.PAID,
          createdAt: {
            gte: firstDayOfMonth,
            lt: firstDayOfNextMonth,
          },
        },
        _sum: {
          totalPrice: true,
        },
      }),
      // Menunggu verifikasi
      this.prisma.booking.count({
        where: {
          payment: {
            status: PaymentStatus.WAITING_VERIFICATION,
          },
        },
      }),
    ]);

    return {
      message: 'Statistik dashboard berhasil diambil',
      data: {
        todayBookings: todayBookingsCount,
        activeBookings: activeBookingsCount,
        monthlyRevenue: monthlyRevenue._sum?.totalPrice || 0,
        pendingVerification: pendingVerificationCount,
      },
    };
  }

  async createOfflineBooking(dto: {
    fieldId: string;
    startTime: string;
    endTime: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }) {
    const { fieldId, startTime, endTime, customerName, customerEmail, customerPhone } = dto;

    // 1. Tentukan/Cari Customer
    let customerId: string;
    const email = customerEmail || `walkin-${Date.now()}-${Math.floor(Math.random() * 1000)}@local.test`;
    
    let customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      // Buat customer default atau customer baru jika belum ada
      customer = await this.prisma.customer.create({
        data: {
          name: customerName || 'Walk-in Customer',
          email,
          phone: customerPhone || null,
          password: '$2b$10$WJ14IkbWCzB06Gojj3IkGem2n0EYRRgdemX8ej11PeAOfw9mezsIe', // hashed default password
        },
      });
    }
    customerId = customer.id;

    // 2. Validasi field exists dan active
    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
      include: { openingHours: true },
    });
    if (!field) {
      throw new NotFoundException('Lapangan tidak ditemukan');
    }
    if (!field.isActive) {
      throw new BadRequestException('Lapangan sedang tidak aktif');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // 3. Validasi waktu
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

    // Cek tabrakan jadwal (conflicting bookings)
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        fieldId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.PAID, BookingStatus.WAITING_PAYMENT],
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

    // 4. Hitung harga (Pro-rata otomatis)
    const totalPrice = await this.calculatePrice(fieldId, start, end);

    // 5. Buat booking berstatus PAID langsung (karena walk-in biasanya langsung bayar tunai di kasir)
    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        fieldId,
        startTime: start,
        endTime: end,
        totalPrice,
        paidAmount: totalPrice,
        status: BookingStatus.PAID,
        payment: {
          create: {
            proofUrl: (dto as any).proofUrl || 'OFFLINE_PAYMENT',
            status: PaymentStatus.APPROVED,
            note: (dto as any).proofUrl ? 'Bukti pembayaran walk-in diunggah' : 'Pembayaran tunai di kasir (Walk-in)',
            verifiedAt: new Date(),
          },
        },
      },
      include: {
        field: {
          select: { name: true },
        },
        customer: {
          select: { name: true, email: true },
        },
      },
    });

    this.logger.log(
      `Offline/Walk-in booking created: ${booking.id} by admin`,
      'BookingsService',
    );

    return {
      message: 'Booking offline berhasil dibuat',
      data: booking,
    };
  }

  async settleBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking dengan ID "${bookingId}" tidak ditemukan`);
    }

    if (booking.status !== BookingStatus.PAID) {
      throw new BadRequestException('Pelunasan hanya dapat dilakukan untuk booking yang sudah aktif/terbayar DP');
    }

    if (booking.paidAmount >= booking.totalPrice) {
      throw new BadRequestException('Booking ini sudah lunas');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paidAmount: booking.totalPrice,
      },
      include: {
        customer: {
          select: { name: true, email: true },
        },
        field: {
          select: { name: true },
        },
      },
    });

    this.logger.log(`Booking ${bookingId} has been fully paid (Pelunasan) at counter`, 'BookingsService');

    return {
      message: 'Pelunasan booking berhasil dicatat',
      data: updatedBooking,
    };
  }

  private async calculatePrice(
    fieldId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<number> {
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
}
