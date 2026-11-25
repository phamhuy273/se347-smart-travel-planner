import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsString,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';
import { ChecklistCategory } from './checklist-category.enum';

export class UpdateChecklistDto {
  @ApiPropertyOptional({
    description: 'Tên vật dụng cần chuẩn bị (1-255 ký tự, không null)',
    example: 'Áo khoác gió',
    maxLength: 255,
  })
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    return typeof raw === 'string' ? raw.trim() : raw;
  })
  @IsString({ message: 'Tên mục checklist phải là chuỗi' })
  @Length(1, 255, { message: 'Tên mục checklist phải từ 1 đến 255 ký tự' })
  item_name?: string;

  @ApiPropertyOptional({
    enum: ChecklistCategory,
    description: 'Danh mục hành lý (hoặc null để bỏ phân loại)',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(({ obj, key }) => obj[key])
  @IsEnum(ChecklistCategory, { message: 'Danh mục không hợp lệ' })
  category?: ChecklistCategory | null;

  @ApiPropertyOptional({
    description: 'Trạng thái đã chuẩn bị xong hay chưa',
    example: true,
  })
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ obj, key }) => obj[key])
  @IsBoolean({ message: 'is_checked phải là kiểu boolean' })
  is_checked?: boolean;

  @ApiPropertyOptional({
    description: 'Thứ tự hiển thị (số nguyên >= 0)',
    example: 0,
    minimum: 0,
  })
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ obj, key }) => obj[key])
  @IsInt({ message: 'order_index phải là số nguyên' })
  @Min(0, { message: 'order_index phải lớn hơn hoặc bằng 0' })
  order_index?: number;
}
