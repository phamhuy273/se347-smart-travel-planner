import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TripsService } from './trips.service';

describe('TripsService', () => {
  let mockPrisma: any;
  let mockTx: any;
  let mockUnsplash: { findCover: ReturnType<typeof vi.fn> };
  let service: TripsService;

  beforeEach(() => {
    mockTx = {
      trip: {
        create: vi.fn().mockImplementation(({ data }: any) =>
          Promise.resolve({ id: 'trip-1', ...data }),
        ),
        findUnique: vi.fn().mockImplementation(({ where }: any) =>
          Promise.resolve({
            id: where.id,
            cover_image_url: mockTx.trip.create.mock.calls[0]?.[0]?.data?.cover_image_url ?? null,
            days: [
              { day_number: 1 },
              { day_number: 2 },
              { day_number: 3 },
            ],
          }),
        ),
      },
      tripDay: {
        createMany: vi.fn().mockResolvedValue({ count: 3 }),
      },
    };

    mockPrisma = {
      $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mockTx)),
      trip: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    };

    mockUnsplash = {
      findCover: vi.fn(),
    };

    service = new TripsService(mockPrisma, mockUnsplash as any);
  });

  it('keeps user-provided cover_image_url without calling Unsplash', async () => {
    const result = await service.create('user-1', {
      title: 'Chuyến đi Đà Lạt',
      destination: 'Đà Lạt, Lâm Đồng',
      start_date: '2026-12-01',
      end_date: '2026-12-03',
      cover_image_url: '  https://cdn.example.com/user-cover.jpg  ',
    });

    expect(mockUnsplash.findCover).not.toHaveBeenCalled();
    expect(mockTx.trip.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cover_image_url: 'https://cdn.example.com/user-cover.jpg',
      }),
    });
    expect(result?.cover_image_url).toBe('https://cdn.example.com/user-cover.jpg');
  });

  it('calls Unsplash before transaction when cover_image_url is whitespace-only or omitted', async () => {
    const callOrder: string[] = [];
    mockUnsplash.findCover.mockImplementationOnce(async () => {
      callOrder.push('unsplash');
      return 'https://images.unsplash.com/photo-dalat?ixid=abc';
    });
    mockPrisma.$transaction.mockImplementationOnce(async (cb: any) => {
      callOrder.push('transaction');
      return cb(mockTx);
    });

    await service.create('user-1', {
      title: 'Chuyến đi Đà Lạt',
      destination: 'Đà Lạt, Lâm Đồng',
      start_date: '2026-12-01',
      end_date: '2026-12-03',
      cover_image_url: '   ',
    });

    expect(mockUnsplash.findCover).toHaveBeenCalledWith('Đà Lạt, Lâm Đồng');
    expect(callOrder).toEqual(['unsplash', 'transaction']);
    expect(mockTx.trip.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cover_image_url: 'https://images.unsplash.com/photo-dalat?ixid=abc',
      }),
    });
  });

  it('still creates trip and all N trip days with null cover_image_url when Unsplash returns null', async () => {
    mockUnsplash.findCover.mockResolvedValueOnce(null);

    const result = await service.create('user-1', {
      title: 'Khám phá Phú Quốc',
      destination: 'Phú Quốc',
      start_date: '2026-12-10',
      end_date: '2026-12-12',
    });

    expect(mockTx.trip.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cover_image_url: null,
      }),
    });
    expect(mockTx.tripDay.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ trip_id: 'trip-1', day_number: 1 }),
        expect.objectContaining({ trip_id: 'trip-1', day_number: 2 }),
        expect.objectContaining({ trip_id: 'trip-1', day_number: 3 }),
      ],
    });
    expect(result?.days).toHaveLength(3);
  });

  it('does not call Unsplash during update()', async () => {
    mockPrisma.trip.findFirst.mockResolvedValueOnce({
      id: 'trip-1',
      owner_id: 'user-1',
      is_deleted: false,
    });
    mockPrisma.trip.update.mockResolvedValueOnce({
      id: 'trip-1',
      destination: 'Nha Trang',
    });

    await service.update('user-1', 'trip-1', { destination: 'Nha Trang' });
    expect(mockUnsplash.findCover).not.toHaveBeenCalled();
  });
});
