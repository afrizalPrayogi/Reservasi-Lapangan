import { Injectable } from '@nestjs/common';
import * as https from 'https';
import { LoggerService } from './logger.service';

@Injectable()
export class EmailService {
  private readonly isEmailEnabled: boolean;

  constructor(private logger: LoggerService) {
    const apiToken = process.env.SMTP_PASS;
    this.isEmailEnabled = Boolean(apiToken);

    if (this.isEmailEnabled) {
      this.logger.log('Email service configured (Mailtrap REST API)', 'EmailService');
    } else {
      this.logger.log(
        'Email service disabled or incomplete SMTP_PASS configuration',
        'EmailService',
      );
    }
  }

  private sendMailViaApi(toEmail: string, toName: string, subject: string, html: string): Promise<void> {
    const apiToken = process.env.SMTP_PASS;
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'mailtrap@demomailtrap.co';
    const fromName = process.env.SMTP_FROM_NAME || 'Tim Badminton Gor tambora';

    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        from: {
          email: fromEmail,
          name: fromName
        },
        to: [
          {
            email: toEmail,
            name: toName
          }
        ],
        subject,
        html
      });

      const options = {
        hostname: 'send.api.mailtrap.io',
        port: 443,
        path: '/api/send',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (d) => { body += d; });
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 202) {
            resolve();
          } else {
            reject(new Error(`Mailtrap API responded with status ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(data);
      req.end();
    });
  }

  async sendBookingCreated(
    customerEmail: string,
    customerName: string,
    bookingDetails: {
      bookingId: string;
      fieldName: string;
      startTime: Date;
      endTime: Date;
      totalPrice: number;
      isDp: boolean;
      dpAmount: number;
    },
  ): Promise<void> {
    const { bookingId, fieldName, startTime, endTime, totalPrice, isDp, dpAmount } =
      bookingDetails;

    const paymentAmount = isDp ? dpAmount : totalPrice;
    const paymentTypeLabel = isDp ? 'Down Payment (DP 50%)' : 'Bayar Lunas (100%)';

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; color: #333;">
          <h2 style="color: #0d1b3e; text-align: center;">Booking Lapangan Berhasil! 🏸</h2>
          <p>Halo <strong>${customerName}</strong>,</p>
          <p>Terima kasih telah melakukan pemesanan lapangan badminton di GOR Tambora. Booking Anda telah terdaftar di sistem kami dan saat ini sedang menunggu verifikasi pembayaran.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d1b3e;">
            <h3 style="margin-top: 0; color: #0d1b3e;">Detail Pemesanan:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; width: 40%;"><strong>ID Booking:</strong></td>
                <td style="padding: 6px 0;">${bookingId.substring(0, 8)}...</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Lapangan:</strong></td>
                <td style="padding: 6px 0;">${fieldName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Waktu Main:</strong></td>
                <td style="padding: 6px 0;">${this.formatDateTime(startTime)} - ${this.formatTime(endTime)} WIB</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Tipe Pembayaran:</strong></td>
                <td style="padding: 6px 0; color: #0d1b3e; font-weight: bold;">${paymentTypeLabel}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Total Harga:</strong></td>
                <td style="padding: 6px 0;">Rp ${this.formatPrice(totalPrice)}</td>
              </tr>
              <tr style="border-top: 1px solid #dee2e6;">
                <td style="padding: 8px 0; font-size: 15px;"><strong>Harus Ditransfer:</strong></td>
                <td style="padding: 8px 0; color: #28a745; font-weight: bold; font-size: 15px;">Rp ${this.formatPrice(paymentAmount)}</td>
              </tr>
            </table>
          </div>

          <p style="background-color: #e8f4fd; padding: 12px; border-radius: 6px; font-size: 13px; color: #0f3d5c;">
            ℹ️ <strong>Informasi Penting:</strong> Tim kami akan segera melakukan verifikasi terhadap bukti transfer yang telah Anda unggah. Anda akan mendapatkan notifikasi email lanjutan setelah pembayaran diverifikasi oleh admin.
          </p>
          
          <p>Harap bersiap dan datang tepat waktu sesuai jadwal main Anda!</p>
          <p style="margin-bottom: 0;">Salam olahraga,</p>
          <p style="margin-top: 5px;"><strong>GOR Tambora Team</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 11px; text-align: center;">
            Email ini dikirim secara otomatis oleh sistem Reservasi Badminton GOR Tambora.
          </p>
        </div>
      `;

    if (!this.isEmailEnabled) {
      this.logger.log(
        `Skipped sending booking created email to ${customerEmail} because API Token is missing`,
        'EmailService',
      );
      return;
    }

    try {
      await this.sendMailViaApi(customerEmail, customerName, '🏸 Booking Lapangan Berhasil Dibuat', htmlContent);
      this.logger.log(
        `Booking created email sent successfully to ${customerEmail}`,
        'EmailService',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking created email to ${customerEmail}`,
        error.message,
        'EmailService',
      );
    }
  }

  async sendBookingApproved(
    customerEmail: string,
    customerName: string,
    bookingDetails: {
      bookingId: string;
      fieldName: string;
      startTime: Date;
      endTime: Date;
      totalPrice: number;
      isDp?: boolean;
      dpAmount?: number;
      paidAmount?: number;
    },
  ): Promise<void> {
    const { bookingId, fieldName, startTime, endTime, totalPrice, isDp = false, dpAmount = 0, paidAmount = 0 } =
      bookingDetails;

    const remainingAmount = totalPrice - paidAmount;

    let subject = '✅ Pembayaran Booking Disetujui';
    let htmlContent = '';

    if (isDp && remainingAmount > 0) {
      subject = '🏸 Uang Muka (DP 50%) Booking Disetujui!';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; color: #333;">
          <h2 style="color: #0d1b3e; text-align: center;">Uang Muka (DP) Disetujui! 🏸</h2>
          <p>Halo <strong>${customerName}</strong>,</p>
          <p>Kami senang menginformasikan bahwa bukti transfer pembayaran uang muka (DP 50%) Anda telah <strong>disetujui</strong>.</p>
          <p>Status booking Anda saat ini adalah: <strong style="color: #0d1b3e;">DP (Belum Lunas)</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #0d1b3e;">Detail Booking & Pembayaran:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; width: 40%;"><strong>ID Booking:</strong></td>
                <td style="padding: 6px 0;">${bookingId.substring(0, 8)}...</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Lapangan:</strong></td>
                <td style="padding: 6px 0;">${fieldName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Waktu Main:</strong></td>
                <td style="padding: 6px 0;">${this.formatDateTime(startTime)} - ${this.formatTime(endTime)} WIB</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Total Harga:</strong></td>
                <td style="padding: 6px 0;">Rp ${this.formatPrice(totalPrice)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>DP Telah Dibayar:</strong></td>
                <td style="padding: 6px 0; color: #28a745; font-weight: bold;">Rp ${this.formatPrice(paidAmount)}</td>
              </tr>
              <tr style="border-top: 1px solid #dee2e6;">
                <td style="padding: 8px 0; font-size: 15px;"><strong>Sisa Tagihan (Tunai di Kasir):</strong></td>
                <td style="padding: 8px 0; color: #dc3545; font-weight: bold; font-size: 15px;">Rp ${this.formatPrice(remainingAmount)}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fff3cd; padding: 12px; border-radius: 6px; font-size: 13px; color: #856404; margin-bottom: 20px;">
            ⚠️ <strong>PENTING:</strong> Sisa pembayaran sebesar <strong>Rp ${this.formatPrice(remainingAmount)}</strong> wajib dilunasi secara tunai/debit di kasir saat Anda tiba di lapangan. Uang muka (DP) yang telah dibayar akan <strong>hangus</strong> apabila Anda tidak datang atau tidak melunasi pembayaran sebelum jam selesai pemesanan berakhir (${this.formatTime(endTime)} WIB).
          </div>
          
          <p>Segera datang ke GOR Tambora dan selamat bertanding! 🏸</p>
          <p style="margin-bottom: 0;">Salam hangat,</p>
          <p style="margin-top: 5px;"><strong>GOR Tambora Team</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 11px; text-align: center;">
            Email ini dikirim secara otomatis oleh sistem Reservasi Badminton GOR Tambora.
          </p>
        </div>
      `;
    } else {
      subject = '✅ Pembayaran Booking Lunas!';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; color: #333;">
          <h2 style="color: #28a745; text-align: center;">Pembayaran Lunas! ✅</h2>
          <p>Halo <strong>${customerName}</strong>,</p>
          <p>Selamat! Pembayaran penuh Anda untuk pemesanan lapangan badminton di GOR Tambora telah <strong>disetujui dan lunas</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #0d1b3e;">Detail Booking & Pembayaran:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; width: 40%;"><strong>ID Booking:</strong></td>
                <td style="padding: 6px 0;">${bookingId.substring(0, 8)}...</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Lapangan:</strong></td>
                <td style="padding: 6px 0;">${fieldName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Waktu Main:</strong></td>
                <td style="padding: 6px 0;">${this.formatDateTime(startTime)} - ${this.formatTime(endTime)} WIB</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Total Harga:</strong></td>
                <td style="padding: 6px 0;">Rp ${this.formatPrice(totalPrice)}</td>
              </tr>
              <tr style="border-top: 1px solid #dee2e6;">
                <td style="padding: 8px 0; font-size: 15px;"><strong>Status Pembayaran:</strong></td>
                <td style="padding: 8px 0; color: #28a745; font-weight: bold; font-size: 15px;">LUNAS (100%)</td>
              </tr>
            </table>
          </div>

          <p>Anda sudah melunasi pesanan lapangan. Segera datang ke GOR Tambora dan selamat bermain! 🏸</p>
          <p style="margin-bottom: 0;">Salam hangat,</p>
          <p style="margin-top: 5px;"><strong>GOR Tambora Team</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 11px; text-align: center;">
            Email ini dikirim secara otomatis oleh sistem Reservasi Badminton GOR Tambora.
          </p>
        </div>
      `;
    }

    if (!this.isEmailEnabled) {
      this.logger.log(
        `Skipped sending email to ${customerEmail} because API Token is missing`,
        'EmailService',
      );
      return;
    }

    try {
      await this.sendMailViaApi(customerEmail, customerName, subject, htmlContent);
      this.logger.log(
        `Booking approved email sent to ${customerEmail}`,
        'EmailService',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${customerEmail}`,
        error.message,
        'EmailService',
      );
    }
  }

  async sendBookingRejected(
    customerEmail: string,
    customerName: string,
    bookingDetails: {
      bookingId: string;
      fieldName: string;
      startTime: Date;
      endTime: Date;
      totalPrice: number;
      rejectionNote?: string;
    },
  ): Promise<void> {
    const {
      bookingId,
      fieldName,
      startTime,
      endTime,
      totalPrice,
      rejectionNote,
    } = bookingDetails;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; color: #333;">
          <h2 style="color: #dc3545; text-align: center;">Pembayaran Ditolak ❌</h2>
          <p>Halo <strong>${customerName}</strong>,</p>
          <p>Mohon maaf, pembayaran untuk booking Anda <strong>tidak dapat disetujui</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin-top: 0; color: #0d1b3e;">Detail Booking:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; width: 40%;"><strong>ID Booking:</strong></td>
                <td style="padding: 6px 0;">${bookingId.substring(0, 8)}...</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Lapangan:</strong></td>
                <td style="padding: 6px 0;">${fieldName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Waktu Main:</strong></td>
                <td style="padding: 6px 0;">${this.formatDateTime(startTime)} - ${this.formatTime(endTime)} WIB</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;"><strong>Total Harga:</strong></td>
                <td style="padding: 6px 0;">Rp ${this.formatPrice(totalPrice)}</td>
              </tr>
            </table>
          </div>

          ${
            rejectionNote
              ? `
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <strong>Alasan Penolakan:</strong>
              <p style="margin: 5px 0 0 0;">${rejectionNote}</p>
            </div>
          `
              : ''
          }

          <p>Silakan lakukan booking ulang dengan bukti pembayaran yang valid. Jika ada pertanyaan, hubungi admin kami.</p>
          <p style="margin-bottom: 0;">Salam hangat,</p>
          <p style="margin-top: 5px;"><strong>GOR Tambora Team</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 11px; text-align: center;">
            Email ini dikirim secara otomatis oleh sistem Reservasi Badminton GOR Tambora.
          </p>
        </div>
      `;

    if (!this.isEmailEnabled) {
      this.logger.log(
        `Skipped sending email to ${customerEmail} because API Token is missing`,
        'EmailService',
      );
      return;
    }

    try {
      await this.sendMailViaApi(customerEmail, customerName, '❌ Pembayaran Booking Ditolak', htmlContent);
      this.logger.log(
        `Booking rejected email sent to ${customerEmail}`,
        'EmailService',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${customerEmail}`,
        error.message,
        'EmailService',
      );
    }
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('id-ID').format(price);
  }
}
