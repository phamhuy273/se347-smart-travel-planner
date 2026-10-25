import { IsOptional, IsUUID, IsNumber, ValidateIf } from 'class-validator';

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
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID(undefined, { message: 'target_day_id phải là định dạng UUID hợp lệ hoặc null' })
  target_day_id?: string | null;

  /**
   * Giá trị order_index của phần tử liền trước vị trí thả mới.
   * - null / không truyền: Chèn vào đầu danh sách (không có phần tử trước).
   */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({}, { message: 'prev_order_index phải là số thực hoặc null' })
  prev_order_index?: number | null;

  /**
   * Giá trị order_index của phần tử liền sau vị trí thả mới.
   * - null / không truyền: Chèn vào cuối danh sách (không có phần tử sau).
   */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({}, { message: 'next_order_index phải là số thực hoặc null' })
  next_order_index?: number | null;
}
