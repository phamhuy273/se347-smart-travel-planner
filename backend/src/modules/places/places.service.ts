import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PlaceCategory } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlaceDto, UpdatePlaceDto, ReorderPlaceDto } from './dto';


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

  /**
   * Thuật toán Fractional Indexing: Tính toán order_index mới khi kéo thả chèn vị trí.
   *
   * @param prevOrderIndex order_index của phần tử liền trước (null nếu chèn đầu)
   * @param nextOrderIndex order_index của phần tử liền sau (null nếu chèn cuối)
   * @returns { index: number, needsRebalance: boolean }
   */
  calculateFractionalIndex(
    prevOrderIndex?: number | null,
    nextOrderIndex?: number | null,
  ): { index: number; needsRebalance: boolean } {
    // Ngưỡng phát hiện khoảng cách số thực tiệm cận giới hạn float của DB
    const REBALANCE_THRESHOLD = 1e-5;

    // Trường hợp 1: Chèn vào giữa 2 phần tử A và B
    if (
      prevOrderIndex !== null &&
      prevOrderIndex !== undefined &&
      nextOrderIndex !== null &&
      nextOrderIndex !== undefined
    ) {
      if (prevOrderIndex >= nextOrderIndex) {
        throw new BadRequestException(
          `Vị trí không hợp lệ: prev_order_index (${prevOrderIndex}) phải nhỏ hơn next_order_index (${nextOrderIndex})`,
        );
      }

      const index = (prevOrderIndex + nextOrderIndex) / 2;
      const diff = nextOrderIndex - prevOrderIndex;
      const needsRebalance = diff < REBALANCE_THRESHOLD;

      return { index, needsRebalance };
    }

    // Trường hợp 2: Chèn lên đầu danh sách (chỉ có nextOrderIndex)
    if (nextOrderIndex !== null && nextOrderIndex !== undefined) {
      const index = nextOrderIndex > 1000 ? nextOrderIndex - 1000 : nextOrderIndex / 2;
      const needsRebalance = index < REBALANCE_THRESHOLD;

      return { index, needsRebalance };
    }

    // Trường hợp 3: Chèn xuống cuối danh sách (chỉ có prevOrderIndex)
    if (prevOrderIndex !== null && prevOrderIndex !== undefined) {
      return {
        index: prevOrderIndex + 1000.0,
        needsRebalance: false,
      };
    }

    // Trường hợp 4: Danh sách đang rỗng
    return {
      index: 1000.0,
      needsRebalance: false,
    };
  }

  /**
   * Kéo thả địa điểm: đổi thứ tự trong cùng ngày, chuyển ngày hoặc đưa về kho lưu tạm.
   * Áp dụng thuật toán Fractional Indexing + Interactive Transaction + Auto Re-balancing.
   */
  async reorderPlace(id: string, dto: ReorderPlaceDto) {
    // 1. Kiểm tra sự tồn tại của địa điểm cần kéo thả
    const place = await this.prisma.placeItem.findUnique({
      where: { id },
      select: {
        id: true,
        trip_id: true,
        trip_day_id: true,
        place_name: true,
      },
    });

    if (!place) {
      throw new NotFoundException(`Địa điểm với id: ${id} không tồn tại`);
    }

    // 2. Xác định ngày đích (target_day_id)
    let finalTargetDayId: string | null = place.trip_day_id;

    if (dto.target_day_id !== undefined) {
      if (dto.target_day_id === null) {
        // Kéo về Kho lưu tạm (Unassigned Pool)
        finalTargetDayId = null;
      } else {
        // Kéo vào một ngày cụ thể -> Kiểm tra ngày có thuộc chuyến đi này không
        const targetDay = await this.prisma.tripDay.findFirst({
          where: { id: dto.target_day_id, trip_id: place.trip_id },
          select: { id: true },
        });

        if (!targetDay) {
          throw new NotFoundException(
            `Ngày đích (id: ${dto.target_day_id}) không thuộc về chuyến đi này`,
          );
        }

        finalTargetDayId = dto.target_day_id;
      }
    }

    // 3. Tính toán order_index mới bằng thuật toán Fractional Indexing
    const { index: calculatedOrderIndex, needsRebalance } =
      this.calculateFractionalIndex(dto.prev_order_index, dto.next_order_index);

    // 4. Thực thi trong Prisma Interactive Transaction để chống Race Condition
    return this.prisma.$transaction(async (tx) => {
      // 4.1. Thực hiện lệnh UPDATE duy nhất cho địa điểm được kéo thả
      const updatedPlace = await tx.placeItem.update({
        where: { id },
        data: {
          trip_day_id: finalTargetDayId,
          order_index: calculatedOrderIndex,
        },
      });

      // 4.2. Task 5.3: Cơ chế Tự động Tái Cân Bằng (Auto Re-balancing)
      if (needsRebalance) {
        this.logger.warn(
          `Khoảng cách order_index quá nhỏ (< 1e-5). Đang tự động tái cân bằng cho ngày: ${finalTargetDayId ?? 'Kho lưu tạm'}...`,
        );

        // Lấy tất cả các địa điểm trong cùng cột ngày đó (đã bao gồm phần tử vừa update)
        const allItemsInDay = await tx.placeItem.findMany({
          where: {
            trip_id: place.trip_id,
            trip_day_id: finalTargetDayId,
          },
          orderBy: { order_index: 'asc' },
          select: { id: true },
        });

        // Phân bổ lại khoảng cách đều đặn 1000.0, 2000.0, 3000.0...
        for (let i = 0; i < allItemsInDay.length; i++) {
          const spacedIndex = (i + 1) * 1000.0;
          await tx.placeItem.update({
            where: { id: allItemsInDay[i].id },
            data: { order_index: spacedIndex },
          });
        }

        this.logger.log(
          `Đã hoàn tất tái cân bằng cho ${allItemsInDay.length} địa điểm trong ngày ${finalTargetDayId ?? 'Kho lưu tạm'}`,
        );
      }

      this.logger.log(
        `Kéo thả thành công: "${place.place_name}" chuyển sang ngày ${finalTargetDayId ?? 'Kho lưu tạm'} với order_index mới: ${calculatedOrderIndex}`,
      );

      return updatedPlace;
    });
  }
}




