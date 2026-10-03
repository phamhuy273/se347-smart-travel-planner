import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService?: MailService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Kiểm tra email đã tồn tại hay chưa
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng. Vui lòng chọn email khác.');
    }

    // 2. Hash mật khẩu bằng bcrypt
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(dto.password, saltRounds);

    // 3. Tạo tài khoản trong cơ sở dữ liệu
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        password_hash,
        full_name: dto.full_name.trim(),
        phone_number: dto.phone_number?.trim(),
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true,
        bio: true,
        phone_number: true,
        is_verified: true,
        created_at: true,
        updated_at: true,
      },
    });

    // 4. Sinh JWT access token
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      user,
      accessToken,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    // 1. Tìm user theo email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 2. Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 3. Sinh JWT access token
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    // 4. Ẩn password_hash trước khi trả về
    const { password_hash: _password_hash, verify_token: _verify_token, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
    };
  }

  async googleLogin(dto: GoogleLoginDto) {
    let email = dto.email?.toLowerCase().trim();
    let fullName = dto.full_name?.trim() || 'Người dùng Google';
    let avatarUrl = dto.avatar_url;
    let googleId = `google_${Date.now()}`;

    // 1. Kiểm tra nếu là Google ID Token thật (JWT gồm 3 phần phân cách bởi dấu chấm)
    const isRealGoogleToken = dto.credential && dto.credential.split('.').length === 3 && !dto.credential.startsWith('mock:');

    if (isRealGoogleToken) {
      try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${dto.credential}`);
        if (!response.ok) {
          throw new UnauthorizedException('Mã xác thực Google không hợp lệ hoặc đã hết hạn');
        }
        const data: any = await response.json();
        email = data.email?.toLowerCase().trim();
        fullName = data.name || fullName;
        avatarUrl = data.picture || avatarUrl;
        googleId = data.sub;
      } catch (err: any) {
        if (err instanceof UnauthorizedException) throw err;
        this.logger.warn(`Google token validation network error, falling back to provided details: ${err.message}`);
      }
    } else if (dto.credential.startsWith('mock:')) {
      // Dev mode mock login
      email = email || `${dto.credential.replace('mock:', '')}@gmail.com`;
      googleId = `mock_gid_${email}`;
    }

    if (!email) {
      throw new BadRequestException('Không tìm thấy thông tin email từ tài khoản Google');
    }

    // 2. Tìm hoặc tạo user trong CSDL
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { google_id: googleId },
        ],
      },
    });

    if (user) {
      // Update Google ID và Avatar nếu chưa có
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          google_id: user.google_id || googleId,
          avatar_url: user.avatar_url || avatarUrl,
          is_verified: true,
        },
      });
    } else {
      // Tạo user mới đăng nhập qua Google
      user = await this.prisma.user.create({
        data: {
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
          google_id: googleId,
          is_verified: true,
        },
      });
    }

    // 3. Cấp access token
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    const { password_hash: _pw, verify_token: _vt, ...safeUser } = user;
    return {
      user: safeUser,
      accessToken,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Email này chưa được đăng ký tài khoản trong hệ thống. Vui lòng kiểm tra lại!');
    }

    // Sinh mã OTP 6 số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verify_token: otpHash,
        verify_token_expires_at: expiresAt,
      },
    });

    // In OTP ra console dev để test nhanh
    this.logger.log(`\n========================================\n[DEV OTP QUÊN MẬT KHẨU] Email: ${email} | MÃ OTP: [ ${otp} ] (Hạn 15 phút)\n========================================\n`);

    // Gửi email thật nếu MailService có cấu hình SMTP
    let isEmailSent = false;
    if (this.mailService) {
      isEmailSent = await this.mailService.sendOtpEmail(user.email, otp, user.full_name);
    }

    return {
      message: isEmailSent
        ? `Mã xác thực OTP 6 số đã được gửi trực tiếp đến hộp thư ${email}.`
        : 'Mã xác thực OTP 6 số đã được tạo thành công.',
      isEmailSent,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.verify_token || !user.verify_token_expires_at) {
      throw new BadRequestException('Yêu cầu xác thực OTP không hợp lệ hoặc đã hết hạn.');
    }

    if (new Date() > user.verify_token_expires_at) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.');
    }

    const isOtpValid = await bcrypt.compare(dto.otp.trim(), user.verify_token);
    if (!isOtpValid) {
      throw new BadRequestException('Mã OTP không chính xác. Vui lòng kiểm tra lại.');
    }

    return {
      message: 'Xác thực mã OTP thành công!',
      valid: true,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.verify_token || !user.verify_token_expires_at) {
      throw new BadRequestException('Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    }

    if (new Date() > user.verify_token_expires_at) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.');
    }

    const isOtpValid = await bcrypt.compare(dto.otp.trim(), user.verify_token);
    if (!isOtpValid) {
      throw new BadRequestException('Mã OTP không chính xác. Vui lòng kiểm tra lại.');
    }

    // Hash mật khẩu mới
    const password_hash = await bcrypt.hash(dto.new_password, 10);

    // Cập nhật mật khẩu và xoá token OTP
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        verify_token: null,
        verify_token_expires_at: null,
      },
    });

    return {
      message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.',
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true,
        bio: true,
        phone_number: true,
        is_verified: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    return user;
  }
}

