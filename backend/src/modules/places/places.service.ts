import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PlaceCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlaceDto, UpdatePlaceDto } from './dto';

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

  /**
   * Lấy chi tiết thông tin một điểm dừng theo ID.
   */
  async getPlaceById(id: string) {
    const place = await this.prisma.placeItem.findUnique({
      where: { id },
      include: {
        trip_day: {
          select: {
            id: true,
            day_number: true,
            date: true,
          },
        },
      },
    });

    if (!place) {
      throw new NotFoundException(`Địa điểm với id: ${id} không tồn tại`);
    }

    return place;
  }

  /**
   * Cập nhật thông tin chi tiết của một điểm dừng (giờ, thời lượng, ghi chú, danh mục...).
   */
  async updatePlace(id: string, dto: UpdatePlaceDto) {
    // 1. Kiểm tra sự tồn tại của địa điểm
    const existingPlace = await this.prisma.placeItem.findUnique({
      where: { id },
      select: { id: true, trip_id: true },
    });

    if (!existingPlace) {
      throw new NotFoundException(`Địa điểm với id: ${id} không tồn tại`);
    }

    // 2. Cập nhật dữ liệu
    const updatedPlace = await this.prisma.placeItem.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Đã cập nhật thông tin địa điểm: ${id}`);

    return updatedPlace;
  }

  /**
   * Xóa vĩnh viễn một địa điểm khỏi chuyến đi.
   */
  async deletePlace(id: string) {
    // 1. Kiểm tra sự tồn tại của địa điểm
    const existingPlace = await this.prisma.placeItem.findUnique({
      where: { id },
      select: { id: true, place_name: true, trip_id: true },
    });

    if (!existingPlace) {
      throw new NotFoundException(`Địa điểm với id: ${id} không tồn tại`);
    }

    // 2. Thực hiện xóa bản ghi
    await this.prisma.placeItem.delete({
      where: { id },
    });

    this.logger.log(`Đã xóa địa điểm "${existingPlace.place_name}" (${id}) khỏi chuyến đi`);

    return {
      id,
      deleted: true,
      message: `Đã xóa địa điểm "${existingPlace.place_name}" thành công`,
    };
  }

  /**
   * Lấy cấu trúc cây toàn bộ lịch trình chuyến đi (các ngày, địa điểm đã sắp xếp, kho lưu tạm).
   * Phục vụ cho giao diện Canvas đa cột và bản đồ Mapbox GL JS của Frontend.
   */
  async getTripItinerary(tripId: string) {
    // 1. Kiểm tra sự tồn tại của chuyến đi
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId, is_deleted: false },
      select: {
        id: true,
        title: true,
        description: true,
        destination: true,
        start_date: true,
        end_date: true,
        cover_image_url: true,
        visibility: true,
        owner_id: true,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Chuyến đi với id: ${tripId} không tồn tại`);
    }

    // 2. Query danh sách các ngày trong chuyến đi, kèm các địa điểm được sắp xếp theo order_index ASC
    const days = await this.prisma.tripDay.findMany({
      where: { trip_id: tripId },
      orderBy: { day_number: 'asc' },
      include: {
        place_items: {
          orderBy: { order_index: 'asc' },
        },
      },
    });

    // 3. Query danh sách các địa điểm trong Kho lưu tạm (trip_day_id = null)
    const unassignedPlaces = await this.prisma.placeItem.findMany({
      where: {
        trip_id: tripId,
        trip_day_id: null,
      },
      orderBy: { order_index: 'asc' },
    });

    const totalPlacesInDays = days.reduce((sum, day) => sum + day.place_items.length, 0);

    return {
      trip,
      days,
      unassigned_places: unassignedPlaces,
      total_places: totalPlacesInDays + unassignedPlaces.length,
    };
  }
}


