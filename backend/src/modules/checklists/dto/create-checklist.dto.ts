import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, Length, ValidateIf } from 'class-validator';
import { ChecklistCategory } from './checklist-category.enum';

export class CreateChecklistDto {
  @ApiProperty({
    description: 'Tên vật dụng cần chuẩn bị (1-255 ký tự)',
    example: 'Hộ chiếu & vé máy bay',
    maxLength: 255,
  })
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    return typeof raw === 'string' ? raw.trim() : raw;
  })
  @IsString({ message: 'Tên mục checklist phải là chuỗi' })
  @Length(1, 255, { message: 'Tên mục checklist phải từ 1 đến 255 ký tự' })
  item_name: string;

  @ApiPropertyOptional({
    enum: ChecklistCategory,
    description: 'Danh mục hành lý (có thể null hoặc bỏ trống)',
    example: ChecklistCategory.DOCUMENTS,
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(({ obj, key }) => obj[key])
  @IsEnum(ChecklistCategory, { message: 'Danh mục không hợp lệ' })
  category?: ChecklistCategory | null;
}
