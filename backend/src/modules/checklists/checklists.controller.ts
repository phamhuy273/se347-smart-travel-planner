import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TrimmedUUIDPipe } from '../../common/pipes/trimmed-uuid.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TripRoles } from '../places/decorators/trip-roles.decorator';
import { TripRoleGuard } from '../places/guards/trip-role.guard';
import { ChecklistsService } from './checklists.service';
import {
  CreateChecklistDto,
  GetChecklistsQueryDto,
  UpdateChecklistDto,
} from './dto';

@ApiTags('Checklists')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TripRoleGuard)
@Controller('trips/:tripId/checklists')
export class ChecklistsController {
  constructor(
    @Inject(ChecklistsService)
    private readonly checklistsService: ChecklistsService,
  ) {}

  @Get()
  @TripRoles(UserRole.OWNER, UserRole.EDITOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'Lấy danh sách checklist hành lý của chuyến đi' })
  @ApiParam({ name: 'tripId', description: 'Mã UUID của chuyến đi' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách checklist thành công' })
  async findAll(
    @Param('tripId', new TrimmedUUIDPipe()) tripId: string,
    @Query() query: GetChecklistsQueryDto,
  ) {
    return this.checklistsService.findAll(tripId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @TripRoles(UserRole.OWNER, UserRole.EDITOR)
  @ApiOperation({ summary: 'Thêm mục mới vào checklist hành lý của chuyến đi' })
  @ApiParam({ name: 'tripId', description: 'Mã UUID của chuyến đi' })
  @ApiResponse({ status: 201, description: 'Tạo mục checklist thành công' })
  async create(
    @Param('tripId', new TrimmedUUIDPipe()) tripId: string,
    @Body() dto: CreateChecklistDto,
  ) {
    return this.checklistsService.create(tripId, dto);
  }

  @Patch(':itemId')
  @HttpCode(HttpStatus.OK)
  @TripRoles(UserRole.OWNER, UserRole.EDITOR)
  @ApiOperation({ summary: 'Cập nhật mục trong checklist hành lý' })
  @ApiParam({ name: 'tripId', description: 'Mã UUID của chuyến đi' })
  @ApiParam({ name: 'itemId', description: 'Mã UUID của mục checklist' })
  @ApiResponse({ status: 200, description: 'Cập nhật mục checklist thành công' })
  async update(
    @Param('tripId', new TrimmedUUIDPipe()) tripId: string,
    @Param('itemId', new TrimmedUUIDPipe()) itemId: string,
    @Body() dto: UpdateChecklistDto,
  ) {
    return this.checklistsService.update(tripId, itemId, dto);
  }

  @Delete(':itemId')
  @HttpCode(HttpStatus.OK)
  @TripRoles(UserRole.OWNER, UserRole.EDITOR)
  @ApiOperation({ summary: 'Xóa mục khỏi checklist hành lý' })
  @ApiParam({ name: 'tripId', description: 'Mã UUID của chuyến đi' })
  @ApiParam({ name: 'itemId', description: 'Mã UUID của mục checklist' })
  @ApiResponse({ status: 200, description: 'Xóa mục checklist thành công' })
  async remove(
    @Param('tripId', new TrimmedUUIDPipe()) tripId: string,
    @Param('itemId', new TrimmedUUIDPipe()) itemId: string,
  ) {
    return this.checklistsService.remove(tripId, itemId);
  }
}
