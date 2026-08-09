import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller('media')
export class MediaController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('field-images/:id')
  @Header('Cache-Control', 'public, max-age=86400')
  async getFieldImage(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const image = await this.prisma.fieldImage.findUnique({
      where: { id },
      select: {
        imageData: true,
        mimeType: true,
        imageUrl: true,
      },
    });

    if (!image) {
      throw new NotFoundException('Gambar field tidak ditemukan');
    }

    if (image.imageData) {
      res.type(image.mimeType || 'image/jpeg');
      return new StreamableFile(Buffer.from(image.imageData));
    }

    if (image.imageUrl) {
      throw new NotFoundException('Binary gambar field tidak tersedia');
    }

    throw new NotFoundException('Gambar field tidak ditemukan');
  }

  @Get('payment-proofs/:bookingId')
  @Header('Cache-Control', 'public, max-age=86400')
  async getPaymentProof(
    @Param('bookingId') bookingId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
      select: {
        proofData: true,
        mimeType: true,
        proofUrl: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Bukti pembayaran tidak ditemukan');
    }

    if (payment.proofData) {
      res.type(payment.mimeType || 'image/jpeg');
      return new StreamableFile(Buffer.from(payment.proofData));
    }

    throw new NotFoundException('Binary bukti pembayaran tidak tersedia');
  }
}
