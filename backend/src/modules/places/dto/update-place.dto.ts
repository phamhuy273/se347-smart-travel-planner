import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePlaceDto } from './create-place.dto';

/**
 * DTO validate dữ liệu khi cập nhật thông tin chi tiết điểm dừng.
 * Tất cả các trường đều optional (chỉ cập nhật trường nào gửi lên).
 * KHÔNG bao gồm trip_day_id — việc chuyển ngày được xử lý bởi API Reorder riêng.
 */
export class UpdatePlaceDto extends PartialType(
  OmitType(CreatePlaceDto, ['trip_day_id'] as const),
) {}
