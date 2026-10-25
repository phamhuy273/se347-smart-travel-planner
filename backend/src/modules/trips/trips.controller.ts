import {
  Body,
  Controller,
  Delete,
  Patch,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { GetTripsQueryDto } from './dto/get-trips-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateTripDto) {
    return this.tripsService.create(userId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: GetTripsQueryDto,
  ) {
    return this.tripsService.findAll(userId, query);
  }

  @Get('upcoming')
  async findUpcoming(@CurrentUser('id') userId: string) {
    return this.tripsService.findUpcoming(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) tripId: string,
  ) {
    return this.tripsService.findOne(userId, tripId);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() dto: UpdateTripDto,
  ) {
    return this.tripsService.update(userId, tripId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) tripId: string,
  ) {
    return this.tripsService.remove(userId, tripId);
  }
}
