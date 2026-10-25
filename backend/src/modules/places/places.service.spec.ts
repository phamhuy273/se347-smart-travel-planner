import { describe, beforeEach, it, expect, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlaceCategory } from '@prisma/client';
import { PlacesService } from './places.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PlacesService - Unit Tests', () => {
  let service: PlacesService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      trip: {
        findUnique: vi.fn(),
      },
      tripDay: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      placeItem: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(prismaMock)),
    };

    service = new PlacesService(prismaMock as unknown as PrismaService);
  });

  // ===========================================================================
  // 1. KIỂM THỬ THUẬT TOÁN FRACTIONAL INDEXING (TRỌNG TÂM KỸ THUẬT)
  // ===========================================================================
  describe('calculateFractionalIndex', () => {
    it('1. Chèn vào giữa 2 phần tử nguyên: A=1000, B=2000 -> Kết quả phải là 1500', () => {
      const result = service.calculateFractionalIndex(1000.0, 2000.0);
      expect(result.index).toBe(1500.0);
      expect(result.needsRebalance).toBe(false);
    });

    it('2. Chèn vào giữa 2 phần tử lẻ: A=1500, B=2000 -> Kết quả phải là 1750', () => {
      const result = service.calculateFractionalIndex(1500.0, 2000.0);
      expect(result.index).toBe(1750.0);
      expect(result.needsRebalance).toBe(false);
    });

    it('3. Chèn lên đầu danh sách khi B > 1000: B=2000 -> Kết quả phải là 1000', () => {
      const result = service.calculateFractionalIndex(null, 2000.0);
      expect(result.index).toBe(1000.0);
      expect(result.needsRebalance).toBe(false);
    });

    it('4. Chèn lên đầu danh sách khi B <= 1000: B=500 -> Kết quả phải là B/2 = 250', () => {
      const result = service.calculateFractionalIndex(null, 500.0);
      expect(result.index).toBe(250.0);
      expect(result.needsRebalance).toBe(false);
    });

    it('5. Chèn xuống cuối danh sách: A=3000 -> Kết quả phải là A + 1000 = 4000', () => {
      const result = service.calculateFractionalIndex(3000.0, null);
      expect(result.index).toBe(4000.0);
      expect(result.needsRebalance).toBe(false);
    });

    it('6. Chèn vào danh sách rỗng (cả prev và next đều null) -> Mặc định là 1000', () => {
      const result = service.calculateFractionalIndex(null, null);
      expect(result.index).toBe(1000.0);
      expect(result.needsRebalance).toBe(false);
    });

    it('7. Phát hiện khoảng cách hẹp (< 1e-5): Cần bật cờ needsRebalance = true', () => {
      const prev = 1000.00001;
      const next = 1000.000015; // diff = 0.000005 < 1e-5
      const result = service.calculateFractionalIndex(prev, next);
      expect(result.needsRebalance).toBe(true);
      expect(result.index).toBeCloseTo(1000.0000125, 7);
    });

    it('8. Ném BadRequestException nếu prev >= next (vị trí nghịch đảo không hợp lệ)', () => {
      expect(() => {
        service.calculateFractionalIndex(2000.0, 1000.0);
      }).toThrow(BadRequestException);

      expect(() => {
        service.calculateFractionalIndex(1500.0, 1500.0);
      }).toThrow(BadRequestException);
    });
  });

  // ===========================================================================
  // 2. KIỂM THỬ NGHIỆP VỤ CRUD
  // ===========================================================================
  describe('CRUD Operations', () => {
    const mockTripId = 'trip-uuid-123';
    const mockPlaceId = 'place-uuid-456';

    it('createPlace: Thêm địa điểm vào cuối danh sách và tính đúng order_index', async () => {
      prismaMock.trip.findUnique.mockResolvedValue({ id: mockTripId, is_deleted: false });
      prismaMock.placeItem.findFirst.mockResolvedValue({ order_index: 2000.0 });
      prismaMock.placeItem.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: mockPlaceId, ...data }),
      );

      const result = await service.createPlace(mockTripId, {
        place_name: 'Bảo tàng Lâm Đồng',
        latitude: 11.94,
        longitude: 108.45,
        category: PlaceCategory.ATTRACTION,
      });

      expect(result.place_name).toBe('Bảo tàng Lâm Đồng');
      // Đã có item order_index=2000 -> item mới phải là 3000
      expect(result.order_index).toBe(3000.0);
      expect(prismaMock.placeItem.create).toHaveBeenCalled();
    });

    it('getPlaceById: Ném NotFoundException nếu địa điểm không tồn tại', async () => {
      prismaMock.placeItem.findUnique.mockResolvedValue(null);

      await expect(service.getPlaceById('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('deletePlace: Xóa thành công bản ghi khi địa điểm tồn tại', async () => {
      prismaMock.placeItem.findUnique.mockResolvedValue({
        id: mockPlaceId,
        place_name: 'Hồ Xuân Hương',
        trip_id: mockTripId,
      });
      prismaMock.placeItem.delete.mockResolvedValue({});

      const result = await service.deletePlace(mockPlaceId);

      expect(result.deleted).toBe(true);
      expect(prismaMock.placeItem.delete).toHaveBeenCalledWith({
        where: { id: mockPlaceId },
      });
    });
  });
});
