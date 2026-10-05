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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlaceCategory } from '@prisma/client';

/**
 * DTO validate dữ liệu khi thêm địa điểm mới vào chuyến đi.
 * Frontend gọi Mapbox Search API trực tiếp, sau đó gửi thông tin đã chọn về Backend qua DTO này.
 */
export class CreatePlaceDto {
  /** ID ngày trong chuyến đi. Để trống (không gửi) = lưu vào Kho lưu tạm (Unassigned Pool) */
  @ApiPropertyOptional({
    description: 'Mã UUID của ngày tham quan. Bỏ trống hoặc null nếu muốn lưu vào Kho lưu tạm',
    example: 'd1a85f64-5717-4562-b3fc-2c963f66af01',
  })
  @IsOptional()
  @IsUUID()
  trip_day_id?: string;

  /** Tên địa điểm (bắt buộc, tối đa 255 ký tự) */
  @ApiProperty({
    description: 'Tên địa điểm từ Mapbox Geocoding API',
    example: 'Quảng trường Lâm Viên',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  place_name: string;

  /** Địa chỉ đầy đủ từ Mapbox */
  @ApiPropertyOptional({
    description: 'Địa chỉ đầy đủ của địa điểm',
    example: 'Đường Trần Quốc Toản, Phường 10, TP. Đà Lạt',
  })
  @IsOptional()
  @IsString()
  formatted_address?: string;

  /** Vĩ độ - Latitude (bắt buộc, từ -90 đến 90) */
  @ApiProperty({
    description: 'Vĩ độ GPS trích xuất từ Mapbox (-90 đến 90)',
    example: 11.9366,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  /** Kinh độ - Longitude (bắt buộc, từ -180 đến 180) */
  @ApiProperty({
    description: 'Kinh độ GPS trích xuất từ Mapbox (-180 đến 180)',
    example: 108.4452,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  /** URL ảnh thumbnail đại diện của địa điểm */
  @ApiPropertyOptional({
    description: 'Đường dẫn ảnh đại diện của địa điểm',
    example: 'https://images.unsplash.com/photo-dalat.jpg',
  })
  @IsOptional()
  @IsUrl()
  thumbnail_url?: string;

  /** Danh mục phân loại: ATTRACTION | RESTAURANT | HOTEL | TRANSPORT | OTHER */
  @ApiPropertyOptional({
    enum: PlaceCategory,
    description:
      'Danh mục phân loại: ATTRACTION (Tham quan), RESTAURANT (Ăn uống), HOTEL (Khách sạn), TRANSPORT (Di chuyển), OTHER (Khác)',
    example: PlaceCategory.ATTRACTION,
  })
  @IsOptional()
  @IsEnum(PlaceCategory)
  category?: PlaceCategory;

  /** Giờ bắt đầu (định dạng HH:mm, ví dụ: "08:30") */
  @ApiPropertyOptional({
    description: 'Giờ bắt đầu tham quan (định dạng 24h: HH:mm)',
    example: '08:30',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start_time phải có định dạng HH:mm (ví dụ: 08:30)',
  })
  start_time?: string;

  /** Thời lượng lưu lại tại điểm (đơn vị: phút, tối thiểu 1) */
  @ApiPropertyOptional({
    description: 'Thời lượng lưu lại tại điểm (phút, tối thiểu 1)',
    example: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration_minutes?: number;

  /** Ghi chú riêng: mã booking, link vé, lưu ý trang phục... */
  @ApiPropertyOptional({
    description: 'Ghi chú riêng: mã booking, lưu ý vé, thời gian đóng cửa...',
    example: 'Chụp ảnh với biểu tượng nụ hoa Atiso và hoa dã quỳ',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
