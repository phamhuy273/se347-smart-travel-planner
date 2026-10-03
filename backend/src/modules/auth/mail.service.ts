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

    // Tách 6 chữ số OTP để hiển thị theo từng ô vé du lịch (Boarding Pass aesthetic)
    const digits = otp.split('');
    const digitBoxesHtml = digits
      .map(
        (d) =>
          `<div style="display: inline-block; width: 44px; height: 54px; line-height: 54px; margin: 0 4px; font-size: 28px; font-weight: 900; color: #0f172a; background: #ffffff; border: 2px solid #0d9488; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.15);">${d}</div>`,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mã xác thực WanderFlow</title>
      </head>
      <body style="margin: 0; padding: 30px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Top Gradient Accent Bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #0d9488 0%, #0284c7 50%, #f97316 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; background: #ffffff;">
              <div style="display: inline-block; padding: 6px 14px; background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 9999px; margin-bottom: 12px;">
                <span style="color: #0f766e; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                  ✈️ SMART TRAVEL PLANNER
                </span>
              </div>
              <h1 style="margin: 0; font-size: 30px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
                Trip<span style="color: #0284c7;">Planner</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #64748b; font-size: 13px; font-weight: 500;">
                WanderFlow — Khám phá trọn vẹn từng chuyến đi
              </p>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <div style="background: #fafaf9; border: 1px dashed #cbd5e1; border-radius: 20px; padding: 28px 24px; text-align: center; position: relative;">
                
                <!-- Travel Stamp Badge -->
                <div style="margin-bottom: 16px;">
                  <span style="display: inline-block; padding: 4px 12px; background: #fff7ed; border: 1px dashed #ea580c; color: #c2410c; font-size: 11px; font-weight: 800; border-radius: 6px; transform: rotate(-1deg);">
                    ★ SECURITY VERIFIED ★
                  </span>
                </div>

                <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 800; color: #0f172a;">
                  Khôi phục mật khẩu tài khoản
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.5;">
                  Xin chào <strong>${recipientName}</strong>,<br>
                  Bạn vừa yêu cầu cấp lại mật khẩu cho tài khoản WanderFlow. Sử dụng mã OTP 6 số bên dưới để tiếp tục:
                </p>

                <!-- 6-Digit OTP Boxes -->
                <div style="margin: 24px 0; text-align: center;">
                  ${digitBoxesHtml}
                </div>

                <div style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 16px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 9999px;">
                  <span style="color: #dc2626; font-size: 12px; font-weight: 700;">
                    ⏰ Mã xác thực có hiệu lực trong 15 phút
                  </span>
                </div>
              </div>

              <!-- Security Notice -->
              <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 14px; border: 1px solid #f1f5f9;">
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                  🔒 <strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nhân viên WanderFlow sẽ không bao giờ yêu cầu mã OTP của bạn. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua thư này để bảo vệ tài khoản.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0f172a; text-align: center; border-bottom-left-radius: 24px; border-bottom-right-radius: 24px;">
              <p style="margin: 0 0 6px 0; color: #f8fafc; font-size: 13px; font-weight: 800;">
                TripPlanner — WanderFlow
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                Đồ án SE347 • Trường Đại học Công nghệ Thông tin (UIT - ĐHQG TP.HCM)<br>
                Hỗ trợ kỹ thuật: <a href="mailto:support@wanderflow.vn" style="color: #38bdf8; text-decoration: none;">support@wanderflow.vn</a>
              </p>
            </td>
          </tr>

        </table>
      </body>
      </html>
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
