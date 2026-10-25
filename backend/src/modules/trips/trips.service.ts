import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TripVisibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { GetTripsQueryDto, TripTab } from './dto/get-trips-query.dto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_TRIP_DAYS = 365;

const tripOwnerSelect = {
  id: true,
  full_name: true,
  avatar_url: true,
} satisfies Prisma.UserSelect;

const tripListInclude = {
  owner: { select: tripOwnerSelect },
  _count: { select: { days: true, place_items: true, likes: true, bookmarks: true } },
} satisfies Prisma.TripInclude;

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTripDto) {
    const startDate = this.parseDate(dto.start_date, 'Ngày bắt đầu');
    const endDate = this.parseDate(dto.end_date, 'Ngày kết thúc');

    if (endDate < startDate) {
      throw new BadRequestException('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu');
    }

    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;

    if (totalDays > MAX_TRIP_DAYS) {
      throw new BadRequestException(`Chuyến đi không được dài quá ${MAX_TRIP_DAYS} ngày`);
    }

    const tripDays = Array.from({ length: totalDays }, (_, index) => ({
      day_number: index + 1,
      date: new Date(startDate.getTime() + index * MS_PER_DAY),
    }));

    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          owner_id: userId,
          title: dto.title.trim(),
          destination: dto.destination.trim(),
          description: dto.description?.trim(),
          cover_image_url: dto.cover_image_url,
          visibility: dto.visibility,
          start_date: startDate,
          end_date: endDate,
        },
      });

      await tx.tripDay.createMany({
        data: tripDays.map((day) => ({
          trip_id: trip.id,
          day_number: day.day_number,
          date: day.date,
        })),
      });

      return tx.trip.findUnique({
        where: { id: trip.id },
        include: {
          days: { orderBy: { day_number: 'asc' } },
        },
      });
    });
  }

  async findAll(userId: string, query: GetTripsQueryDto) {
    const tab = query.tab ?? TripTab.ALL;
    const search = query.search?.trim();

    const conditions: Prisma.TripWhereInput = { is_deleted: false };

    if (search) {
      conditions.title = { contains: search, mode: 'insensitive' };
    }

    let where: Prisma.TripWhereInput;

    switch (tab) {
      case TripTab.MINE:
        where = { ...conditions, owner_id: userId };
        break;
      case TripTab.SAVED:
        where = { ...conditions, bookmarks: { some: { user_id: userId } } };
        break;
      default:
        where = {
          ...conditions,
          OR: [
            { visibility: TripVisibility.PUBLIC },
            { owner_id: userId },
            { members: { some: { user_id: userId } } },
          ],
        };
    }

    return this.prisma.trip.findMany({
      where,
      include: tripListInclude,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, is_deleted: false },
      include: {
        owner: { select: tripOwnerSelect },
        days: { orderBy: { day_number: 'asc' } },
        members: {
          where: { user_id: userId },
          select: { role: true },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException('Không tìm thấy chuyến đi');
    }

    const isOwner = trip.owner_id === userId;
    const isMember = trip.members.length > 0;

    if (trip.visibility === TripVisibility.PRIVATE && !isOwner && !isMember) {
      throw new ForbiddenException('Bạn không có quyền xem chuyến đi này');
    }

    const { members, ...result } = trip;

    return {
      ...result,
      my_role: isOwner ? 'OWNER' : isMember ? members[0].role : null,
    };
  }

  async findUpcoming(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return this.prisma.trip.findFirst({
      where: {
        owner_id: userId,
        is_deleted: false,
        start_date: { gte: today },
      },
      include: {
        owner: { select: tripOwnerSelect },
        days: { orderBy: { day_number: 'asc' } },
      },
      orderBy: [{ start_date: 'asc' }, { created_at: 'asc' }],
    });
  }

  async update(userId: string, tripId: string, dto: UpdateTripDto) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, is_deleted: false },
    });

    if (!trip) {
      throw new NotFoundException('Không tìm thấy chuyến đi');
    }

    if (trip.owner_id !== userId) {
      throw new ForbiddenException('Chỉ chủ sở hữu mới có quyền chỉnh sửa chuyến đi này');
    }

    const data: Prisma.TripUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.destination !== undefined) data.destination = dto.destination;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.cover_image_url !== undefined) data.cover_image_url = dto.cover_image_url;
    if (dto.visibility !== undefined) data.visibility = dto.visibility;
    if (dto.start_date !== undefined) data.start_date = this.parseDate(dto.start_date, 'Ngày bắt đầu');
    if (dto.end_date !== undefined) data.end_date = this.parseDate(dto.end_date, 'Ngày kết thúc');

    return this.prisma.trip.update({
      where: { id: tripId },
      data,
    });
  }

  async remove(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, is_deleted: false },
    });

    if (!trip) {
      throw new NotFoundException('Không tìm thấy chuyến đi');
    }

    if (trip.owner_id !== userId) {
      throw new ForbiddenException('Chỉ chủ sở hữu mới có quyền xóa chuyến đi này');
    }

    await this.prisma.trip.update({
      where: { id: tripId },
      data: { is_deleted: true },
    });

    return {
      id: tripId,
      deleted: true,
      message: 'Xóa chuyến đi thành công',
    };
  }

  private parseDate(value: string, label: string): Date {
    const rawDate = value && value.includes('T') ? value.split('T')[0] : value;
    const date = new Date(`${rawDate}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${label} không hợp lệ`);
    }

    return date;
  }
}
