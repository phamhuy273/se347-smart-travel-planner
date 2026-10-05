import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PlaceCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlaceDto } from './dto';

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Thêm một địa điểm mới vào chuyến đi (vào ngày cụ thể hoặc kho lưu tạm).
   * Tự động tính toán order_index nằm ở cuối danh sách.
   */
  async createPlace(tripId: string, dto: CreatePlaceDto) {
    // 1. Kiểm tra sự tồn tại của chuyến đi
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId, is_deleted: false },
      select: { id: true },
    });

    if (!trip) {
      throw new NotFoundException(`Chuyến đi với id: ${tripId} không tồn tại`);
    }

    // 2. Nếu có chọn ngày (trip_day_id), kiểm tra ngày đó có thuộc chuyến đi này không
    if (dto.trip_day_id) {
      const tripDay = await this.prisma.tripDay.findFirst({
        where: { id: dto.trip_day_id, trip_id: tripId },
        select: { id: true },
      });

      if (!tripDay) {
        throw new NotFoundException(
          `Ngày lịch trình (trip_day_id: ${dto.trip_day_id}) không thuộc về chuyến đi này`,
        );
      }
    }

    // 3. Tìm order_index lớn nhất hiện tại của ngày đó (hoặc của kho lưu tạm)
    const lastItem = await this.prisma.placeItem.findFirst({
      where: {
        trip_id: tripId,
        trip_day_id: dto.trip_day_id ?? null,
      },
      orderBy: { order_index: 'desc' },
      select: { order_index: true },
    });

    // Mặc định cách nhau 1000.0 đơn vị để dự phòng cho việc kéo thả chèn giữa
    const newOrderIndex = lastItem ? lastItem.order_index + 1000.0 : 1000.0;

    // 4. Lưu bản ghi mới vào CSDL
    const createdPlace = await this.prisma.placeItem.create({
      data: {
        trip_id: tripId,
        trip_day_id: dto.trip_day_id ?? null,
        place_name: dto.place_name,
        formatted_address: dto.formatted_address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        thumbnail_url: dto.thumbnail_url,
        category: dto.category ?? PlaceCategory.ATTRACTION,
        start_time: dto.start_time,
        duration_minutes: dto.duration_minutes,
        notes: dto.notes,
        order_index: newOrderIndex,
      },
    });

    this.logger.log(
      `Đã thêm địa điểm "${createdPlace.place_name}" vào chuyến đi ${tripId} (order_index: ${newOrderIndex})`,
    );

    return createdPlace;
  }
}
