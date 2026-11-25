import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { ChecklistCategory } from './checklist-category.enum';

export class GetChecklistsQueryDto {
  @ApiPropertyOptional({
    enum: ChecklistCategory,
    description: 'Lọc theo danh mục hành lý',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(ChecklistCategory, { message: 'Danh mục không hợp lệ' })
  category?: ChecklistCategory;
}
