import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_TRIP_DAYS = 365;

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

  private parseDate(value: string, label: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${label} không hợp lệ`);
    }

    return date;
  }
}
