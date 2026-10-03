import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
