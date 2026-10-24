import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TripVisibility } from '@prisma/client';

export class CreateTripDto {
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(255, { message: 'Tiêu đề tối đa 255 ký tự' })
  title: string;

  @IsString({ message: 'Điểm đến phải là chuỗi' })
  @IsNotEmpty({ message: 'Điểm đến không được để trống' })
  @MaxLength(255, { message: 'Điểm đến tối đa 255 ký tự' })
  destination: string;

  @IsDateString({}, { message: 'Ngày bắt đầu phải có định dạng YYYY-MM-DD' })
  start_date: string;

  @IsDateString({}, { message: 'Ngày kết thúc phải có định dạng YYYY-MM-DD' })
  end_date: string;

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
