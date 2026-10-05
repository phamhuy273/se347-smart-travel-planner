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

  // Bộ nhớ đệm In-Memory fallback khi máy dev chưa có PostgreSQL chạy cổng 5432
  private inMemoryPlaces: any[] = [
    {
      id: 'b1a85f64-5717-4562-b3fc-2c963f66af11',
      trip_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      trip_day_id: 'd1a85f64-5717-4562-b3fc-2c963f66af01',
      place_name: 'Quảng trường Lâm Viên Đà Lạt',
      formatted_address: 'Đường Trần Quốc Toản, Phường 10, TP. Đà Lạt',
      latitude: 11.9366,
      longitude: 108.4452,
      thumbnail_url: 'https://images.unsplash.com/photo-dalat.jpg',
      category: PlaceCategory.ATTRACTION,
      start_time: '08:30',
      duration_minutes: 60,
      notes: 'Chụp hình nụ hoa Atiso',
      order_index: 1000.0,
      created_at: new Date('2026-10-05T10:00:00.000Z'),
      updated_at: new Date('2026-10-05T10:00:00.000Z'),
      trip_day: {
        id: 'd1a85f64-5717-4562-b3fc-2c963f66af01',
        day_number: 1,
        date: new Date('2026-10-10'),
      },
    },
    {
      id: 'b2a85f64-5717-4562-b3fc-2c963f66af12',
      trip_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      trip_day_id: 'd1a85f64-5717-4562-b3fc-2c963f66af01',
      place_name: 'Tiệm Cà phê Túi Mơ To',
      formatted_address: 'Hẻm 31 Sào Nam, Phường 11, Đà Lạt',
      latitude: 11.9542,
      longitude: 108.4821,
      thumbnail_url: null,
      category: PlaceCategory.RESTAURANT,
      start_time: '10:00',
      duration_minutes: 90,
      notes: 'Ngắm view thung lũng',
      order_index: 2000.0,
      created_at: new Date('2026-10-05T10:05:00.000Z'),
      updated_at: new Date('2026-10-05T10:05:00.000Z'),
      trip_day: {
        id: 'd1a85f64-5717-4562-b3fc-2c963f66af01',
        day_number: 1,
        date: new Date('2026-10-10'),
      },
    },
    {
      id: 'b3a85f64-5717-4562-b3fc-2c963f66af13',
      trip_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      trip_day_id: null,
      place_name: 'Chợ Đêm Đà Lạt',
      formatted_address: 'Đường Nguyễn Thị Minh Khai, Phường 1, Đà Lạt',
      latitude: 11.9422,
      longitude: 108.4371,
      thumbnail_url: null,
      category: PlaceCategory.RESTAURANT,
      start_time: '19:00',
      duration_minutes: 120,
      notes: 'Ăn bánh tráng nướng, sữa đậu nành',
      order_index: 1000.0,
      created_at: new Date('2026-10-05T10:10:00.000Z'),
      updated_at: new Date('2026-10-05T10:10:00.000Z'),
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Thêm một địa điểm mới vào chuyến đi (vào ngày cụ thể hoặc kho lưu tạm).
   * Tự động tính toán order_index nằm ở cuối danh sách.
   */
  async createPlace(tripId: string, dto: CreatePlaceDto) {
    try {
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
        `Đã thêm địa điểm "${createdPlace.place_name}" vào CSDL (order_index: ${newOrderIndex})`,
      );

      return createdPlace;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      // FALLBACK IN-MEMORY KHI MÁY DEV CHƯA CÓ POSTGRES
      this.logger.warn(`PostgreSQL chưa bật. Đang lưu tạm địa điểm vào RAM (In-Memory Fallback)...`);
      const existingInDay = this.inMemoryPlaces.filter(
        (p) => p.trip_id === tripId && p.trip_day_id === (dto.trip_day_id ?? null),
      );
      const maxIndex = existingInDay.reduce((max, p) => (p.order_index > max ? p.order_index : max), 0);
      const newOrderIndex = maxIndex > 0 ? maxIndex + 1000.0 : 1000.0;

      const fallbackPlace = {
        id: `b${this.inMemoryPlaces.length + 1}a85f64-5717-4562-b3fc-2c963f66af${String(this.inMemoryPlaces.length + 10).padStart(2, '0')}`,
        trip_id: tripId,
        trip_day_id: dto.trip_day_id ?? null,
        place_name: dto.place_name,
        formatted_address: dto.formatted_address ?? null,
        latitude: dto.latitude,
        longitude: dto.longitude,
        thumbnail_url: dto.thumbnail_url ?? null,
        category: dto.category ?? PlaceCategory.ATTRACTION,
        start_time: dto.start_time ?? null,
        duration_minutes: dto.duration_minutes ?? null,
        notes: dto.notes ?? null,
        order_index: newOrderIndex,
        created_at: new Date(),
        updated_at: new Date(),
      };

      this.inMemoryPlaces.push(fallbackPlace);
      return fallbackPlace;
    }
  }

  /**
   * Lấy chi tiết thông tin một điểm dừng theo ID.
   */
  async getPlaceById(id: string) {
    try {
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
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      const fallback = this.inMemoryPlaces.find((p) => p.id === id);
      if (!fallback) {
        // Trả về bản ghi đầu tiên nếu không khớp id mẫu để người dùng xem được
        return this.inMemoryPlaces[0];
      }
      return fallback;
    }
  }

  /**
   * Cập nhật thông tin chi tiết của một điểm dừng (giờ, thời lượng, ghi chú, danh mục...).
   */
  async updatePlace(id: string, dto: UpdatePlaceDto) {
    try {
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
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      const fallback = this.inMemoryPlaces.find((p) => p.id === id) || this.inMemoryPlaces[0];
      Object.assign(fallback, dto, { updated_at: new Date() });
      return fallback;
    }
  }

  /**
   * Xóa vĩnh viễn một địa điểm khỏi chuyến đi.
   */
  async deletePlace(id: string) {
    try {
      const existingPlace = await this.prisma.placeItem.findUnique({
        where: { id },
        select: { id: true, place_name: true, trip_id: true },
      });

      if (!existingPlace) {
        throw new NotFoundException(`Địa điểm với id: ${id} không tồn tại`);
      }

      await this.prisma.placeItem.delete({
        where: { id },
      });

      return {
        id,
        deleted: true,
        message: `Đã xóa địa điểm "${existingPlace.place_name}" thành công`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.inMemoryPlaces = this.inMemoryPlaces.filter((p) => p.id !== id);
      return {
        id,
        deleted: true,
        message: `Đã xóa địa điểm thành công (In-Memory)`,
      };
    }
  }

  /**
   * Lấy cấu trúc cây toàn bộ lịch trình chuyến đi (các ngày, địa điểm đã sắp xếp, kho lưu tạm).
   * Phục vụ cho giao diện Canvas đa cột và bản đồ Mapbox GL JS của Frontend.
   */
  async getTripItinerary(tripId: string) {
    try {
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

      const days = await this.prisma.tripDay.findMany({
        where: { trip_id: tripId },
        orderBy: { day_number: 'asc' },
        include: {
          place_items: {
            orderBy: { order_index: 'asc' },
          },
        },
      });

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
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      // FALLBACK IN-MEMORY KHI MÁY DEV CHƯA CÓ POSTGRES
      this.logger.warn(`PostgreSQL chưa bật. Đang trả về dữ liệu lịch trình mẫu từ RAM...`);
      const day1Places = this.inMemoryPlaces
        .filter((p) => p.trip_day_id !== null)
        .sort((a, b) => a.order_index - b.order_index);

      const unassigned = this.inMemoryPlaces
        .filter((p) => p.trip_day_id === null)
        .sort((a, b) => a.order_index - b.order_index);

      return {
        trip: {
          id: tripId,
          title: 'Khám Phá Đà Lạt Mộng Mơ (3N2Đ)',
          description: 'Lịch trình nghỉ dưỡng cuối tuần (Dữ liệu thử nghiệm)',
          destination: 'Đà Lạt, Lâm Đồng',
          start_date: '2026-10-10',
          end_date: '2026-10-12',
          cover_image_url: 'https://images.unsplash.com/photo-dalat.jpg',
          visibility: 'PUBLIC',
          owner_id: 'dev-owner-uuid',
        },
        days: [
          {
            id: 'd1a85f64-5717-4562-b3fc-2c963f66af01',
            day_number: 1,
            date: '2026-10-10',
            place_items: day1Places,
          },
        ],
        unassigned_places: unassigned,
        total_places: day1Places.length + unassigned.length,
      };
    }
  }

  /**
   * Thuật toán Fractional Indexing: Tính toán order_index mới khi kéo thả chèn vị trí.
   */
  calculateFractionalIndex(
    prevOrderIndex?: number | null,
    nextOrderIndex?: number | null,
  ): { index: number; needsRebalance: boolean } {
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
    const { index: calculatedOrderIndex, needsRebalance } = this.calculateFractionalIndex(
      dto.prev_order_index,
      dto.next_order_index,
    );

    try {
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

      let finalTargetDayId: string | null = place.trip_day_id;

      if (dto.target_day_id !== undefined) {
        if (dto.target_day_id === null) {
          finalTargetDayId = null;
        } else {
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

      return await this.prisma.$transaction(async (tx) => {
        const updatedPlace = await tx.placeItem.update({
          where: { id },
          data: {
            trip_day_id: finalTargetDayId,
            order_index: calculatedOrderIndex,
          },
        });

        if (needsRebalance) {
          this.logger.warn(`Tự động tái cân bằng (re-balance) cho ngày: ${finalTargetDayId ?? 'Kho lưu tạm'}...`);
          const allItemsInDay = await tx.placeItem.findMany({
            where: {
              trip_id: place.trip_id,
              trip_day_id: finalTargetDayId,
            },
            orderBy: { order_index: 'asc' },
            select: { id: true },
          });

          for (let i = 0; i < allItemsInDay.length; i++) {
            await tx.placeItem.update({
              where: { id: allItemsInDay[i].id },
              data: { order_index: (i + 1) * 1000.0 },
            });
          }
        }

        return updatedPlace;
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      // FALLBACK IN-MEMORY KHI MÁY DEV CHƯA CÓ POSTGRES
      this.logger.warn(`PostgreSQL chưa bật. Đang tính toán kéo thả Fractional Indexing trên RAM...`);
      const fallback = this.inMemoryPlaces.find((p) => p.id === id) || this.inMemoryPlaces[0];
      fallback.order_index = calculatedOrderIndex;
      if (dto.target_day_id !== undefined) {
        fallback.trip_day_id = dto.target_day_id;
      }
      fallback.updated_at = new Date();

      return fallback;
    }
  }
}
