import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PlacesService } from './places.service';
import { CreatePlaceDto, UpdatePlaceDto } from './dto';
import { TripRoleGuard } from './guards/trip-role.guard';
import { TripRoles } from './decorators/trip-roles.decorator';

@Controller()
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  /**
   * API Thêm địa điểm mới vào chuyến đi (gán vào ngày cụ thể hoặc kho lưu tạm).
   * Yêu cầu quyền: OWNER hoặc EDITOR của chuyến đi.
   */
  @Post('trips/:tripId/places')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TripRoleGuard)
  @TripRoles(UserRole.OWNER, UserRole.EDITOR)
  async createPlace(
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
    @Body() dto: CreatePlaceDto,
  ) {
    return this.placesService.createPlace(tripId, dto);
  }

  /**
   * API Lấy thông tin chi tiết một điểm dừng theo ID.
   * Yêu cầu quyền: OWNER, EDITOR hoặc VIEWER của chuyến đi.
   */
  @Get('places/:id')
  @UseGuards(TripRoleGuard)
  @TripRoles(UserRole.OWNER, UserRole.EDITOR, UserRole.VIEWER)
  async getPlaceById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.placesService.getPlaceById(id);
  }

  /**
   * API Cập nhật thông tin chi tiết điểm dừng (giờ, thời lượng, ghi chú, danh mục).
   * Yêu cầu quyền: OWNER hoặc EDITOR của chuyến đi.
   */
  @Patch('places/:id')
  @UseGuards(TripRoleGuard)
  @TripRoles(UserRole.OWNER, UserRole.EDITOR)
  async updatePlace(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePlaceDto,
  ) {
    return this.placesService.updatePlace(id, dto);
  }

  /**
   * API Xóa vĩnh viễn địa điểm khỏi lịch trình chuyến đi.
   * Yêu cầu quyền: OWNER hoặc EDITOR của chuyến đi.
   */
  @Delete('places/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TripRoleGuard)
  @TripRoles(UserRole.OWNER, UserRole.EDITOR)
  async deletePlace(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.placesService.deletePlace(id);
  }
}
