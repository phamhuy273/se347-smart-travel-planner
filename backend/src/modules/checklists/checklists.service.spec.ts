import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { ChecklistsService } from './checklists.service';
import {
  ChecklistCategory,
  CreateChecklistDto,
  GetChecklistsQueryDto,
  UpdateChecklistDto,
} from './dto';

describe('ChecklistsService', () => {
  let mockPrisma: any;
  let service: ChecklistsService;

  const tripId = '11111111-1111-4111-8111-111111111111';
  const itemId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    mockPrisma = {
      trip: {
        findFirst: vi.fn(),
      },
      tripChecklist: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new ChecklistsService(mockPrisma);
  });

  it('findAll: returns items sorted by order_index asc, created_at asc, id asc and filters by category', async () => {
    mockPrisma.trip.findFirst.mockResolvedValue({ id: tripId });
    mockPrisma.tripChecklist.findMany.mockResolvedValue([
      { id: itemId, trip_id: tripId, item_name: 'Áo khoác', category: 'CLOTHING' },
    ]);

    const all = await service.findAll(tripId, {});
    expect(all).toHaveLength(1);
    expect(mockPrisma.tripChecklist.findMany).toHaveBeenCalledWith({
      where: { trip_id: tripId },
      orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }, { id: 'asc' }],
    });

    await service.findAll(tripId, { category: ChecklistCategory.CLOTHING });
    expect(mockPrisma.tripChecklist.findMany).toHaveBeenLastCalledWith({
      where: { trip_id: tripId, category: ChecklistCategory.CLOTHING },
      orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }, { id: 'asc' }],
    });
  });

  it('create: sets order_index to 0 on empty list and max + 1 on non-empty list', async () => {
    mockPrisma.trip.findFirst.mockResolvedValue({ id: tripId });
    mockPrisma.tripChecklist.findFirst.mockResolvedValueOnce(null);
    mockPrisma.tripChecklist.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: itemId, ...data }),
    );

    const first = await service.create(tripId, { item_name: 'Hộ chiếu' });
    expect(first.order_index).toBe(0);
    expect(first.category).toBeNull();
    expect(first.is_checked).toBe(false);

    mockPrisma.tripChecklist.findFirst.mockResolvedValueOnce({ order_index: 4 });
    const next = await service.create(tripId, {
      item_name: 'Sạc dự phòng',
      category: ChecklistCategory.ELECTRONICS,
    });
    expect(next.order_index).toBe(5);
    expect(next.category).toBe(ChecklistCategory.ELECTRONICS);
  });

  it('update: updates item scoped by both id and trip_id, and supports clearing category with null', async () => {
    mockPrisma.trip.findFirst.mockResolvedValue({ id: tripId });
    mockPrisma.tripChecklist.findFirst.mockResolvedValue({
      id: itemId,
      trip_id: tripId,
      item_name: 'Hộ chiếu',
    });
    mockPrisma.tripChecklist.update.mockResolvedValue({
      id: itemId,
      trip_id: tripId,
      item_name: 'Hộ chiếu mới',
      category: null,
      is_checked: true,
      order_index: 2,
    });

    const updated = await service.update(tripId, itemId, {
      item_name: 'Hộ chiếu mới',
      category: null,
      is_checked: true,
      order_index: 2,
    });

    expect(updated.is_checked).toBe(true);
    expect(mockPrisma.tripChecklist.findFirst).toHaveBeenCalledWith({
      where: { id: itemId, trip_id: tripId },
    });
    expect(mockPrisma.tripChecklist.update).toHaveBeenCalledWith({
      where: { id: itemId, trip_id: tripId },
      data: {
        item_name: 'Hộ chiếu mới',
        category: null,
        is_checked: true,
        order_index: 2,
      },
    });
  });

  it('remove: deletes item scoped by id and trip_id', async () => {
    mockPrisma.trip.findFirst.mockResolvedValue({ id: tripId });
    mockPrisma.tripChecklist.findFirst.mockResolvedValue({ id: itemId, trip_id: tripId });
    mockPrisma.tripChecklist.delete.mockResolvedValue({ id: itemId });

    const res = await service.remove(tripId, itemId);
    expect(res).toEqual({
      id: itemId,
      deleted: true,
      message: 'Đã xóa mục checklist thành công',
    });
    expect(mockPrisma.tripChecklist.delete).toHaveBeenCalledWith({
      where: { id: itemId, trip_id: tripId },
    });
  });

  it('throws 404 when trip does not exist or is_deleted on all 4 CRUD operations', async () => {
    mockPrisma.trip.findFirst.mockResolvedValue(null);

    await expect(service.findAll(tripId, {})).rejects.toThrow(NotFoundException);
    await expect(service.create(tripId, { item_name: 'A' })).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      service.update(tripId, itemId, { is_checked: true }),
    ).rejects.toThrow(NotFoundException);
    await expect(service.remove(tripId, itemId)).rejects.toThrow(NotFoundException);

    expect(mockPrisma.trip.findFirst).toHaveBeenCalledWith({
      where: { id: tripId, is_deleted: false },
      select: { id: true },
    });
  });

  it('throws 404 (anti-IDOR) when updating or deleting an item belonging to another trip', async () => {
    mockPrisma.trip.findFirst.mockResolvedValue({ id: tripId });
    mockPrisma.tripChecklist.findFirst.mockResolvedValue(null);

    await expect(
      service.update(tripId, itemId, { is_checked: true }),
    ).rejects.toThrow(NotFoundException);
    await expect(service.remove(tripId, itemId)).rejects.toThrow(NotFoundException);

    expect(mockPrisma.tripChecklist.update).not.toHaveBeenCalled();
    expect(mockPrisma.tripChecklist.delete).not.toHaveBeenCalled();
  });
});

describe('Checklists DTO ValidationPipe', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  });

  const validateBody = (dtoClass: any, body: any) =>
    pipe.transform(body, { type: 'body', metatype: dtoClass });

  const validateQuery = (query: any) =>
    pipe.transform(query, { type: 'query', metatype: GetChecklistsQueryDto });

  it('rejects whitespace-only item_name, null item_name, unknown category, and string "false" for is_checked', async () => {
    await expect(
      validateBody(CreateChecklistDto, { item_name: '   ' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(CreateChecklistDto, { item_name: 'Áo mưa', category: 'FOOD' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(UpdateChecklistDto, { item_name: null }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(UpdateChecklistDto, { item_name: '   ' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(UpdateChecklistDto, { is_checked: 'false' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(UpdateChecklistDto, { order_index: -1 }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(UpdateChecklistDto, { order_index: 1000001 }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(UpdateChecklistDto, { order_index: 1.5 }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validateBody(UpdateChecklistDto, { order_index: null }),
    ).rejects.toThrow(BadRequestException);

    await expect(validateQuery({ category: 'UNKNOWN' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('accepts valid trimmed item_name, valid categories, null category, real boolean is_checked, boundary order_index, and empty query category', async () => {
    const created = await validateBody(CreateChecklistDto, {
      item_name: '  Kem chống nắng  ',
      category: ChecklistCategory.PERSONAL,
    });
    expect(created).toEqual({
      item_name: 'Kem chống nắng',
      category: ChecklistCategory.PERSONAL,
    });

    const updated = await validateBody(UpdateChecklistDto, {
      category: null,
      is_checked: false,
      order_index: 0,
    });
    expect(updated).toEqual({
      category: null,
      is_checked: false,
      order_index: 0,
    });

    const maxOrderIndex = await validateBody(UpdateChecklistDto, {
      order_index: 1000000,
    });
    expect(maxOrderIndex).toEqual({
      order_index: 1000000,
    });

    const queryEmpty = await validateQuery({ category: '' });
    expect(queryEmpty).toEqual({ category: undefined });
  });
});
