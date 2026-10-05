import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto';
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
}
