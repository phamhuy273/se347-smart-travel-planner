import { IsOptional, IsUUID, IsNumber, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO validate payload gửi lên từ Frontend khi thực hiện thao tác kéo thả (Drag & Drop).
 * Hỗ trợ 3 trường hợp:
 * 1. Đổi thứ tự trong cùng 1 ngày (Reorder).
 * 2. Di chuyển từ ngày này sang ngày khác (Move across days).
 * 3. Kéo thả vào hoặc ra khỏi Kho lưu tạm (Unassigned Pool).
 */
export class ReorderPlaceDto {
  /**
   * ID của ngày mục tiêu (TripDay).
   * - Có giá trị UUID: Thả vào ngày cụ thể.
   * - null: Thả vào Kho lưu tạm (Unassigned Pool).
   * - Không truyền: Giữ nguyên ngày hiện tại (chỉ đổi thứ tự trong cùng ngày).
   */
  @ApiPropertyOptional({
    description:
      'ID của ngày chuyển tới. Truyền UUID nếu chuyển sang ngày khác, null nếu kéo vào Kho lưu tạm, hoặc bỏ trống nếu giữ nguyên ngày',
    example: 'd1a85f64-5717-4562-b3fc-2c963f66af01',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID(undefined, { message: 'target_day_id phải là định dạng UUID hợp lệ hoặc null' })
  target_day_id?: string | null;

  /**
   * Giá trị order_index của phần tử liền trước vị trí thả mới.
   * - null / không truyền: Chèn vào đầu danh sách (không có phần tử trước).
   */
  @ApiPropertyOptional({
    description:
      'order_index của phần tử đứng trước vị trí thả mới. Bỏ trống hoặc null nếu chèn lên đầu danh sách',
    example: 1000.0,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({}, { message: 'prev_order_index phải là số thực hoặc null' })
  prev_order_index?: number | null;

  /**
   * Giá trị order_index của phần tử liền sau vị trí thả mới.
   * - null / không truyền: Chèn vào cuối danh sách (không có phần tử sau).
   */
  @ApiPropertyOptional({
    description:
      'order_index của phần tử đứng sau vị trí thả mới. Bỏ trống hoặc null nếu chèn xuống cuối danh sách',
    example: 2000.0,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({}, { message: 'next_order_index phải là số thực hoặc null' })
  next_order_index?: number | null;
}
