import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateChecklistDto,
  GetChecklistsQueryDto,
  UpdateChecklistDto,
} from './dto';

@Injectable()
export class ChecklistsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  private async ensureTripExists(tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, is_deleted: false },
      select: { id: true },
    });

    if (!trip) {
      throw new NotFoundException(`Không tìm thấy chuyến đi với id: ${tripId}`);
    }
  }

  private async ensureItemBelongsToTrip(tripId: string, itemId: string) {
    const item = await this.prisma.tripChecklist.findFirst({
      where: { id: itemId, trip_id: tripId },
    });

    if (!item) {
      throw new NotFoundException(`Không tìm thấy mục checklist với id: ${itemId}`);
    }

    return item;
  }

  async findAll(tripId: string, query: GetChecklistsQueryDto = {}) {
    await this.ensureTripExists(tripId);

    const where: Prisma.TripChecklistWhereInput = { trip_id: tripId };
    if (query.category) {
      where.category = query.category;
    }

    return this.prisma.tripChecklist.findMany({
      where,
      orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }, { id: 'asc' }],
    });
  }

  async create(tripId: string, dto: CreateChecklistDto) {
    await this.ensureTripExists(tripId);

    const lastItem = await this.prisma.tripChecklist.findFirst({
      where: { trip_id: tripId },
      orderBy: { order_index: 'desc' },
      select: { order_index: true },
    });

    const nextOrderIndex = lastItem ? lastItem.order_index + 1 : 0;

    return this.prisma.tripChecklist.create({
      data: {
        trip_id: tripId,
        item_name: dto.item_name,
        category: dto.category ?? null,
        is_checked: false,
        order_index: nextOrderIndex,
      },
    });
  }

  async update(tripId: string, itemId: string, dto: UpdateChecklistDto) {
    await this.ensureTripExists(tripId);
    const existing = await this.ensureItemBelongsToTrip(tripId, itemId);

    const data: Prisma.TripChecklistUpdateInput = {};
    if (dto.item_name !== undefined) data.item_name = dto.item_name;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.is_checked !== undefined) data.is_checked = dto.is_checked;
    if (dto.order_index !== undefined) data.order_index = dto.order_index;

    if (Object.keys(data).length === 0) {
      return existing;
    }

    return this.prisma.tripChecklist.update({
      where: { id: itemId, trip_id: tripId },
      data,
    });
  }

  async remove(tripId: string, itemId: string) {
    await this.ensureTripExists(tripId);
    await this.ensureItemBelongsToTrip(tripId, itemId);

    await this.prisma.tripChecklist.delete({
      where: { id: itemId, trip_id: tripId },
    });

    return {
      id: itemId,
      deleted: true,
      message: 'Đã xóa mục checklist thành công',
    };
  }
}
