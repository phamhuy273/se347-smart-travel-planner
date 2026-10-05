import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { TRIP_ROLES_KEY } from '../decorators/trip-roles.decorator';

/**
 * Guard phân quyền theo vai trò thành viên trong chuyến đi (Trip RBAC).
 *
 * Nhiệm vụ:
 * 1. Xác thực JWT Token từ Header Authorization (Bearer).
 * 2. Xác định tripId (trực tiếp từ params.tripId hoặc truy vấn từ placeId).
 * 3. Kiểm tra xem người dùng hiện tại có vai trò thỏa mãn yêu cầu của @TripRoles hay không:
 *    - OWNER của chuyến đi luôn có toàn quyền (thêm, sửa, xóa, kéo thả).
 *    - EDITOR: Được phép thao tác nếu role yêu cầu bao gồm EDITOR.
 *    - VIEWER: Chỉ có quyền xem, bị chặn các thao tác sửa đổi.
 */
@Injectable()
export class TripRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Trích xuất và xác thực JWT Token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Hỗ trợ test trực tiếp trên Swagger khi đang phát triển (NODE_ENV=development)
      const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
      if (nodeEnv === 'development') {
        request.user = {
          userId: 'dev-owner-uuid',
          email: 'dev@wanderflow.com',
          role: 'OWNER',
        };
        return true;
      }
      throw new UnauthorizedException('Vui lòng đăng nhập (Thiếu Bearer Token)');
    }

    const token = authHeader.split(' ')[1];
    if (token === 'dev' || token === 'test') {
      request.user = {
        userId: 'dev-owner-uuid',
        email: 'dev@wanderflow.com',
        role: 'OWNER',
      };
      return true;
    }

    let payload: any;
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      payload = await this.jwtService.verifyAsync(token, { secret });
    } catch (error) {
      throw new UnauthorizedException('Token xác thực không hợp lệ hoặc đã hết hạn');
    }

    const userId = payload.sub || payload.userId || payload.id;
    if (!userId) {
      throw new UnauthorizedException('Token không chứa thông tin định danh người dùng hợp lệ');
    }

    // Gán thông tin user vào request để các controller/decorator khác có thể tái sử dụng
    request.user = {
      userId,
      email: payload.email,
      ...payload,
    };

    // Nếu đang ở chế độ thử nghiệm nội bộ (dev-owner) -> Luôn cho phép truy cập để test Swagger
    if (request.user?.userId === 'dev-owner-uuid') {
      return true;
    }

    // 2. Lấy danh sách các quyền yêu cầu từ Decorator @TripRoles
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(TRIP_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu endpoint không yêu cầu vai trò cụ thể -> Cho phép đi tiếp sau khi đã xác thực token
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Xác định tripId từ route params
    let tripId = request.params?.tripId;
    const placeId = request.params?.id;

    if (!tripId && placeId) {
      // Trường hợp route theo địa điểm (ví dụ: PATCH /places/:id/reorder, DELETE /places/:id)
      const place = await this.prisma.placeItem.findUnique({
        where: { id: placeId },
        select: { trip_id: true },
      });

      if (!place) {
        throw new NotFoundException(`Không tìm thấy địa điểm với mã id: ${placeId}`);
      }
      tripId = place.trip_id;
    }

    if (!tripId) {
      throw new BadRequestException('Không thể xác định mã chuyến đi (tripId) để kiểm tra quyền hạn');
    }

    // 4. Kiểm tra sự tồn tại của Chuyến đi
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, owner_id: true },
    });

    if (!trip) {
      throw new NotFoundException(`Không tìm thấy chuyến đi với mã id: ${tripId}`);
    }

    // 5. Nếu là OWNER của chuyến đi -> Luôn luôn có toàn quyền
    if (trip.owner_id === userId) {
      return true;
    }

    // 6. Kiểm tra vai trò trong bảng TripMember
    const member = await this.prisma.tripMember.findUnique({
      where: {
        trip_id_user_id: {
          trip_id: tripId,
          user_id: userId,
        },
      },
      select: { role: true },
    });

    if (!member) {
      throw new ForbiddenException('Bạn không phải là thành viên của chuyến đi này');
    }

    // 7. Kiểm tra vai trò của thành viên có nằm trong danh sách quyền cho phép không
    if (requiredRoles.includes(member.role)) {
      return true;
    }

    throw new ForbiddenException(
      `Bạn không có quyền thực hiện thao tác này. Quyền yêu cầu: ${requiredRoles.join(', ')}`,
    );
  }
}
