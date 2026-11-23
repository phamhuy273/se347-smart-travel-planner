import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PlacesService } from './places.service';
import { CreatePlaceDto, UpdatePlaceDto, ReorderPlaceDto } from './dto';
import { TripRoleGuard } from './guards/trip-role.guard';
import { TripRoles } from './decorators/trip-roles.decorator';
import { TrimmedUUIDPipe } from '../../common/pipes/trimmed-uuid.pipe';

@ApiTags('Module 3: Lập Lịch Trình Kéo Thả & Bản Đồ Mapbox')
@ApiBearerAuth('JWT-auth')
@Controller()
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  /**
   * API Thêm địa điểm mới vào chuyến đi (gán vào ngày cụ thể hoặc kho lưu tạm).
   * Yêu cầu quyền: OWNER hoặc EDITOR của chuyến đi.
   */
  @Post('trips/:tripId/places')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(TripRoleGuard)
  @TripRoles(UserRole.OWNER, UserRole.EDITOR)
  @ApiOperation({
    summary: '1. Thêm địa điểm mới vào chuyến đi hoặc Kho lưu tạm',
    description:
      'Frontend gọi Mapbox Autocomplete API bóc tách tọa độ kinh/vĩ độ (latitude, longitude), tên địa chỉ rồi gửi về đây lưu trữ. Địa điểm mới tự động được gán order_index vào cuối danh sách của ngày đó (hoặc cuối kho lưu tạm).',
  })
  @ApiParam({
    name: 'tripId',
    description: 'Mã UUID của chuyến đi',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiResponse({ status: 201, description: 'Đã thêm địa điểm thành công vào lịch trình' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ (sai tọa độ GPS, thiếu tên địa điểm...)' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập (Thiếu Bearer Token)' })
  @ApiResponse({ status: 403, description: 'Không có quyền chỉnh sửa trên chuyến đi này' })
  @ApiResponse({ status: 404, description: 'Chuyến đi hoặc ngày không tồn tại' })
  async createPlace(
    @Param('tripId', new TrimmedUUIDPipe()) tripId: string,
    @Body() dto: CreatePlaceDto,
  ) {
    return this.placesService.createPlace(tripId, dto);
  }

  /**
   * API Lấy toàn bộ lịch trình chuyến đi (cây dữ liệu các ngày + địa điểm đã sắp xếp + kho lưu tạm).
   * Yêu cầu quyền: OWNER, EDITOR hoặc VIEWER của chuyến đi.
   */
  @Get('trips/:tripId/itinerary')
  @UseGuards(TripRoleGuard)
  @TripRoles(UserRole.OWNER, UserRole.EDITOR, UserRole.VIEWER)
  @ApiOperation({
    summary: '2. Lấy toàn bộ cây dữ liệu lịch trình chuyến đi (Timeline Canvas & Bản đồ Mapbox)',
    description:
      'Trả về danh sách tất cả các ngày (Day 1, Day 2...) chứa các địa điểm đã sắp xếp thứ tự 1-2-3 theo order_index tăng dần, và mảng unassigned_places cho Kho lưu tạm. Frontend dùng dữ liệu này để đổ ra các cột kéo thả và vẽ tuyến đường Polyline trên Mapbox GL JS.',
  })
  @ApiParam({
    name: 'tripId',
    description: 'Mã UUID của chuyến đi',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiResponse({ status: 200, description: 'Lấy lịch trình thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập chuyến đi này' })
  @ApiResponse({ status: 404, description: 'Chuyến đi không tồn tại' })
  async getTripItinerary(@Param('tripId', new TrimmedUUIDPipe()) tripId: string) {
    return this.placesService.getTripItinerary(tripId);
  }

  /**
   * API Lấy thông tin chi tiết một điểm dừng theo ID.
   * Yêu cầu quyền: OWNER, EDITOR hoặc VIEWER của chuyến đi.
   */
  @Get('places/:id')
  @UseGuards(TripRoleGuard)
  @TripRoles(UserRole.OWNER, UserRole.EDITOR, UserRole.VIEWER)
  @ApiOperation({
    summary: '3. Xem thông tin chi tiết một điểm dừng',
    description:
      'Lấy thông tin chi tiết của một địa điểm theo ID, bao gồm ngày tham quan, giờ bắt đầu, thời lượng, danh mục, ghi chú và tọa độ GPS.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã UUID của địa điểm (mẫu: b1a85f64-5717-4562-b3fc-2c963f66af11)',
    example: 'b1a85f64-5717-4562-b3fc-2c963f66af11',
  })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy địa điểm' })
  async getPlaceById(@Param('id', new TrimmedUUIDPipe()) id: string) {
    return this.placesService.getPlaceById(id);
  }

  /**
   * API Cập nhật thông tin chi tiết điểm dừng (giờ, thời lượng, ghi chú, danh mục).
   * Yêu cầu quyền: OWNER hoặc EDITOR của chuyến đi.
   */
  @Patch('places/:id')
  @UseGuards(TripRoleGuard)
  @TripRoles(UserRole.OWNER, UserRole.EDITOR)
  @ApiOperation({
    summary: '4. Cập nhật thông tin chi tiết điểm dừng (Giờ, thời lượng, ghi chú, danh mục)',
    description:
      'Chỉnh sửa thông tin điểm dừng khi người dùng mở Modal tùy biến thẻ. Chỉ cần gửi những trường cần cập nhật.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã UUID của địa điểm (mẫu: b1a85f64-5717-4562-b3fc-2c963f66af11)',
    example: 'b1a85f64-5717-4562-b3fc-2c963f66af11',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền chỉnh sửa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy địa điểm' })
  async updatePlace(
    @Param('id', new TrimmedUUIDPipe()) id: string,
    @Body() dto: UpdatePlaceDto,
  ) {
    return this.placesService.updatePlace(id, dto);
  }

  /**
   * API Kéo thả đổi vị trí hoặc chuyển ngày địa điểm (Fractional Indexing).
   * Yêu cầu quyền: OWNER hoặc EDITOR của chuyến đi.
   */
  @Patch('places/:id/reorder')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TripRoleGuard)
  @TripRoles(UserRole.OWNER, UserRole.EDITOR)
  @ApiOperation({
    summary: '5. [KÉO THẢ] Đổi vị trí hoặc chuyển ngày (Thuật toán Fractional Indexing)',
    description:
      'API phục vụ trực tiếp cho thư viện vuedraggable. Khi người dùng thả chuột, Frontend gửi ID ngày đích và order_index của 2 phần tử liền trước/sau. Backend tính order_index mới bằng công thức (A + B) / 2 và thực thi ĐÚNG 1 CÂU LỆNH UPDATE DUY NHẤT trong Interactive Transaction. Tự động kích hoạt Auto Re-balancing nếu khoảng cách < 1e-5.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã UUID của địa điểm đang được kéo thả (mẫu: b1a85f64-5717-4562-b3fc-2c963f66af11)',
    example: 'b1a85f64-5717-4562-b3fc-2c963f66af11',
  })
  @ApiResponse({ status: 200, description: 'Kéo thả thành công và vị trí mới đã được cập nhật' })
  @ApiResponse({ status: 400, description: 'Vị trí không hợp lệ (prev_order_index >= next_order_index)' })
  @ApiResponse({ status: 403, description: 'Không có quyền kéo thả trên chuyến đi này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy địa điểm hoặc ngày đích' })
  async reorderPlace(
    @Param('id', new TrimmedUUIDPipe()) id: string,
    @Body() dto: ReorderPlaceDto,
  ) {
    return this.placesService.reorderPlace(id, dto);
  }

  /**
   * API Xóa vĩnh viễn địa điểm khỏi lịch trình chuyến đi.
   * Yêu cầu quyền: OWNER hoặc EDITOR của chuyến đi.
   */
  @Delete('places/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TripRoleGuard)
  @TripRoles(UserRole.OWNER, UserRole.EDITOR)
  @ApiOperation({
    summary: '6. Xóa vĩnh viễn địa điểm khỏi lịch trình',
    description: 'Xóa địa điểm khỏi chuyến đi. Yêu cầu quyền OWNER hoặc EDITOR.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã UUID của địa điểm cần xóa (mẫu: b1a85f64-5717-4562-b3fc-2c963f66af11)',
    example: 'b1a85f64-5717-4562-b3fc-2c963f66af11',
  })
  @ApiResponse({ status: 200, description: 'Đã xóa địa điểm thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy địa điểm' })
  async deletePlace(@Param('id', new TrimmedUUIDPipe()) id: string) {
    return this.placesService.deletePlace(id);
  }
}
