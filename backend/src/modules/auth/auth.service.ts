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
import * as crypto from 'crypto';
import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MailService } from './mail.service';

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  full_name: true,
  avatar_url: true,
  bio: true,
  phone_number: true,
  is_verified: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService?: MailService,
  ) {}

  private toPublicUser(user: Record<string, any>) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url ?? null,
      bio: user.bio ?? null,
      phone_number: user.phone_number ?? null,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  private getRefreshCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'strict' : 'lax') as 'strict' | 'lax',
      path: '/',
    };
  }

  private setRefreshTokenCookie(res: Response | undefined, rawRefreshToken: string) {
    if (res && typeof res.cookie === 'function') {
      res.cookie('refresh_token', rawRefreshToken, {
        ...this.getRefreshCookieOptions(),
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    // 1. Kiểm tra email đã tồn tại hay chưa
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (!existingUser.is_verified) {
        // Tài khoản đã đăng ký nhưng chưa kích hoạt:
        // Cập nhật lại mật khẩu & họ tên mới nhất (phòng trường hợp người dùng gõ nhầm ở lần 1),
        // đồng thời làm mới token và gửi lại email xác nhận mới nhất.
        const password_hash = await bcrypt.hash(dto.password, 10);
        const verifyToken = crypto.randomBytes(32).toString('hex');
        const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            full_name: dto.full_name.trim(),
            password_hash,
            verify_token: verifyToken,
            verify_token_expires_at: verifyExpiresAt,
          },
        });

        if (this.mailService) {
          await this.mailService.sendVerificationEmail(existingUser.email, verifyToken, dto.full_name.trim());
        }

        return {
          message: 'Tài khoản này chưa kích hoạt. Thông tin của bạn đã được cập nhật và email kích hoạt mới đã được gửi!',
          email: existingUser.email,
          requiresVerification: true,
        };
      }
      throw new ConflictException('Email này đã được sử dụng. Vui lòng chọn email khác.');
    }

    // 2. Hash mật khẩu bằng bcrypt
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(dto.password, saltRounds);

    // 3. Sinh verify_token ngẫu nhiên an toàn (hạn 24 giờ)
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 4. Tạo tài khoản trong cơ sở dữ liệu với is_verified: false
    const user = await this.prisma.user.create({
      data: {
        email,
        password_hash,
        full_name: dto.full_name.trim(),
        phone_number: dto.phone_number?.trim(),
        is_verified: false,
        verify_token: verifyToken,
        verify_token_expires_at: verifyExpiresAt,
      },
      select: USER_PUBLIC_SELECT,
    });

    // 5. Gửi email xác nhận kèm nút bấm kích hoạt
    if (this.mailService) {
      await this.mailService.sendVerificationEmail(user.email, verifyToken, user.full_name);
    }

    return {
      message: 'Đăng ký thành công! Vui lòng kiểm tra email và bấm xác nhận để kích hoạt tài khoản của bạn.',
      email: user.email,
      requiresVerification: true,
    };
  }

  async verifyEmail(token: string, email: string, res?: Response) {
    const trimmedEmail = (email || '').toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user || user.verify_token !== token) {
      throw new BadRequestException('Link xác nhận tài khoản không hợp lệ hoặc đã được sử dụng trước đó.');
    }

    if (user.verify_token_expires_at && new Date() > user.verify_token_expires_at) {
      throw new BadRequestException('Link kích hoạt tài khoản đã hết hạn (24 giờ). Vui lòng yêu cầu gửi lại email xác nhận mới.');
    }

    // Đánh dấu is_verified: true và xoá verify_token
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        verify_token: null,
        verify_token_expires_at: null,
      },
      select: USER_PUBLIC_SELECT,
    });

    const session = await this.createSession(updatedUser, res);

    return {
      message: 'Kích hoạt tài khoản thành công! Chào mừng bạn gia nhập WanderFlow.',
      ...session,
    };
  }

  async resendVerification(email: string) {
    const trimmedEmail = (email || '').toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản với email này.');
    }

    if (user.is_verified) {
      return { message: 'Tài khoản này đã được kích hoạt trước đó rồi. Bạn có thể đăng nhập ngay!' };
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verify_token: verifyToken,
        verify_token_expires_at: verifyExpiresAt,
      },
    });

    if (this.mailService) {
      await this.mailService.sendVerificationEmail(user.email, verifyToken, user.full_name);
    }

    return { message: 'Đã gửi lại email xác nhận kích hoạt tài khoản thành công. Vui lòng kiểm tra hòm thư!' };
  }

  private async issueSessionTokens(
    user: any,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    // 1. Sinh Access Token (15-30 phút theo chuẩn bảo mật, chứa sub, email, role)
    const payload = { sub: user.id, email: user.email, role: 'USER' };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '30m') as any,
    });

    // 2. Sinh Refresh Token ngẫu nhiên và lưu vào CSDL (refresh_tokens)
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

    await db.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: refreshExpiresAt,
      },
    });

    return {
      user: this.toPublicUser(user),
      accessToken,
      rawRefreshToken,
    };
  }

  async createSession(
    user: any,
    res?: Response,
    tx?: Prisma.TransactionClient,
  ) {
    const { rawRefreshToken, ...session } = await this.issueSessionTokens(
      user,
      tx ?? this.prisma,
    );

    // 3. Gán Refresh Token vào HttpOnly Cookie nếu có response object
    this.setRefreshTokenCookie(res, rawRefreshToken);

    return session;
  }

  async login(dto: LoginDto, res?: Response) {
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

    // 3. Chặn đăng nhập nếu chưa xác thực email
    if (!user.is_verified) {
      throw new UnauthorizedException('Tài khoản của bạn chưa được kích hoạt email. Vui lòng kiểm tra hộp thư để bấm xác nhận trước khi đăng nhập!');
    }

    // 4. Cấp cặp Access Token & Refresh Token (lưu DB + gán HttpOnly Cookie)
    return this.createSession(user, res);
  }

  async googleLogin(dto: GoogleLoginDto, res?: Response) {
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

    // 3. Cấp cặp Access Token & Refresh Token
    return this.createSession(user, res);
  }

  async refreshToken(rawRefreshToken: string | undefined, res?: Response) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Không tìm thấy phiên làm việc (Refresh Token)');
    }

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        token_hash: tokenHash,
        is_revoked: false,
      },
      include: {
        user: { select: USER_PUBLIC_SELECT },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã bị thu hồi');
    }

    if (new Date() > tokenRecord.expires_at) {
      await this.prisma.refreshToken.updateMany({
        where: { id: tokenRecord.id, is_revoked: false },
        data: { is_revoked: true },
      });
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
    }

    // Thu hồi refresh token cũ (Token Rotation) và tạo phiên mới nguyên tử trong transaction
    const { rawRefreshToken: nextRawRefreshToken, ...session } =
      await this.prisma.$transaction(async (tx) => {
        const revoked = await tx.refreshToken.updateMany({
          where: { id: tokenRecord.id, is_revoked: false },
          data: { is_revoked: true },
        });

        if (revoked.count !== 1) {
          throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã bị thu hồi');
        }

        return this.issueSessionTokens(tokenRecord.user, tx);
      });

    // Chỉ set cookie sau khi transaction thành công
    this.setRefreshTokenCookie(res, nextRawRefreshToken);
    return session;
  }

  async logout(rawRefreshToken: string | undefined, res?: Response) {
    if (rawRefreshToken) {
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      await this.prisma.refreshToken.updateMany({
        where: {
          token_hash: tokenHash,
          is_revoked: false,
        },
        data: {
          is_revoked: true,
        },
      });
    }

    if (res && typeof res.clearCookie === 'function') {
      res.clearCookie('refresh_token', this.getRefreshCookieOptions());
    }

    return { message: 'Đăng xuất thành công' };
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

    // Cập nhật mật khẩu, xoá OTP và thu hồi mọi refresh token còn hiệu lực trong một transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          password_hash,
          verify_token: null,
          verify_token_expires_at: null,
        },
      });

      await tx.refreshToken.updateMany({
        where: {
          user_id: user.id,
          is_revoked: false,
        },
        data: {
          is_revoked: true,
        },
      });
    });

    return {
      message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.',
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_PUBLIC_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {};

    if (dto.full_name !== undefined) data.full_name = dto.full_name;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.phone_number !== undefined) data.phone_number = dto.phone_number;
    if (dto.avatar_url !== undefined) data.avatar_url = dto.avatar_url;

    if (Object.keys(data).length === 0) {
      return this.getMe(userId);
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: USER_PUBLIC_SELECT,
    });
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    res?: Response,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    if (!user.password_hash) {
      throw new BadRequestException(
        'Tài khoản đăng nhập bằng Google chưa có mật khẩu. Vui lòng sử dụng "Quên mật khẩu" để tạo mật khẩu mới.',
      );
    }

    const isCurrentValid = await bcrypt.compare(
      dto.current_password,
      user.password_hash,
    );
    if (!isCurrentValid) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const isSamePassword = await bcrypt.compare(
      dto.new_password,
      user.password_hash,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'Mật khẩu mới không được trùng với mật khẩu hiện tại',
      );
    }

    const password_hash = await bcrypt.hash(dto.new_password, 10);

    const { rawRefreshToken, ...session } = await this.prisma.$transaction(
      async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { password_hash },
          select: USER_PUBLIC_SELECT,
        });

        await tx.refreshToken.updateMany({
          where: {
            user_id: user.id,
            is_revoked: false,
          },
          data: {
            is_revoked: true,
          },
        });

        return this.issueSessionTokens(updatedUser, tx);
      },
    );

    this.setRefreshTokenCookie(res, rawRefreshToken);

    return {
      message: 'Đổi mật khẩu thành công!',
      ...session,
    };
  }
}

