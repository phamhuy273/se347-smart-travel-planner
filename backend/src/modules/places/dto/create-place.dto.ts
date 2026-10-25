import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsUrl,
  IsInt,
  MaxLength,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { PlaceCategory } from '@prisma/client';

/**
 * DTO validate dữ liệu khi thêm địa điểm mới vào chuyến đi.
 * Frontend gọi Mapbox Search API trực tiếp, sau đó gửi thông tin đã chọn về Backend qua DTO này.
 */
export class CreatePlaceDto {
  /** ID ngày trong chuyến đi. Để trống (không gửi) = lưu vào Kho lưu tạm (Unassigned Pool) */
  @IsOptional()
  @IsUUID()
  trip_day_id?: string;

  /** Tên địa điểm (bắt buộc, tối đa 255 ký tự) */
  @IsString()
  @MaxLength(255)
  place_name: string;

  /** Địa chỉ đầy đủ từ Mapbox */
  @IsOptional()
  @IsString()
  formatted_address?: string;

  /** Vĩ độ - Latitude (bắt buộc, từ -90 đến 90) */
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  /** Kinh độ - Longitude (bắt buộc, từ -180 đến 180) */
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  /** URL ảnh thumbnail đại diện của địa điểm */
  @IsOptional()
  @IsUrl()
  thumbnail_url?: string;

  /** Danh mục phân loại: ATTRACTION | RESTAURANT | HOTEL | TRANSPORT | OTHER */
  @IsOptional()
  @IsEnum(PlaceCategory)
  category?: PlaceCategory;

  /** Giờ bắt đầu (định dạng HH:mm, ví dụ: "08:30") */
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start_time phải có định dạng HH:mm (ví dụ: 08:30)',
  })
  start_time?: string;

  /** Thời lượng lưu lại tại điểm (đơn vị: phút, tối thiểu 1) */
  @IsOptional()
  @IsInt()
  @Min(1)
  duration_minutes?: number;

  /** Ghi chú riêng: mã booking, link vé, lưu ý trang phục... */
  @IsOptional()
  @IsString()
  notes?: string;
}
