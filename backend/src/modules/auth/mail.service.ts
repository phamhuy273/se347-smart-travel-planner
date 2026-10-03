import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  initTransporter() {
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mailer initialized for user: ${user}`);
    } else {
      this.logger.warn('SMTP_USER or SMTP_PASS not set in backend/.env. Real email delivery is paused.');
    }
  }

  async sendOtpEmail(toEmail: string, otp: string, recipientName: string = 'Bạn'): Promise<boolean> {
    if (!this.transporter) {
      this.initTransporter();
    }

    if (!this.transporter) {
      this.logger.warn(`Cannot send real email to ${toEmail} because SMTP credentials are missing in backend/.env`);
      return false;
    }

    const from = process.env.SMTP_FROM || `WanderFlow <${process.env.SMTP_USER}>`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Trip<span style="color: #0284c7;">Planner</span></h1>
          <p style="color: #64748b; font-size: 13px; margin: 6px 0 0;">WanderFlow — Khám phá trọn vẹn từng chuyến đi</p>
        </div>
        
        <div style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 28px 20px; text-align: center; border: 1px solid #e2e8f0;">
          <p style="color: #334155; font-size: 15px; margin: 0 0 12px;">Xin chào <strong>${recipientName}</strong>,</p>
          <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 24px;">Bạn vừa gửi yêu cầu đặt lại mật khẩu cho tài khoản tại WanderFlow. Dưới đây là mã xác thực OTP của bạn:</p>
          
          <div style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; font-size: 34px; font-weight: 800; letter-spacing: 8px; padding: 14px 36px; border-radius: 14px; margin: 0 auto 20px; box-shadow: 0 8px 20px rgba(13, 148, 136, 0.28);">
            ${otp}
          </div>
          
          <p style="color: #ef4444; font-size: 12px; font-weight: 600; margin: 8px 0 0;">⏰ Mã xác thực này có hiệu lực trong vòng 15 phút.</p>
        </div>

        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 28px; line-height: 1.6;">
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ tại <a href="mailto:support@wanderflow.vn" style="color: #0d9488; text-decoration: none; font-weight: bold;">support@wanderflow.vn</a>.
        </p>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from,
        to: toEmail,
        subject: `[WanderFlow] ${otp} là mã xác thực đặt lại mật khẩu của bạn`,
        html,
      });
      this.logger.log(`Real OTP email sent to ${toEmail}. Message ID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${toEmail}: ${error.message}`);
      return false;
    }
  }
}
