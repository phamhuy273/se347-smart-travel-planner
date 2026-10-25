import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TripVisibility } from '@prisma/client';

export class UpdateTripDto {
  @IsOptional()
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @MaxLength(255, { message: 'Tiêu đề tối đa 255 ký tự' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Điểm đến phải là chuỗi' })
  @MaxLength(255, { message: 'Điểm đến tối đa 255 ký tự' })
  destination?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu phải có định dạng YYYY-MM-DD' })
  start_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc phải có định dạng YYYY-MM-DD' })
  end_date?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Ảnh bìa phải là chuỗi' })
  cover_image_url?: string;

  @IsOptional()
  @IsEnum(TripVisibility, { message: 'Chế độ hiển thị không hợp lệ' })
  visibility?: TripVisibility;
}
