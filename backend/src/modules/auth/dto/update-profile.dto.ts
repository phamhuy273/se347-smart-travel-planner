import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

function trimRawString(obj: Record<string, any>, key: string) {
  const raw = obj[key];
  return typeof raw === 'string' ? raw.trim() : raw;
}

function trimToNullIfEmpty(obj: Record<string, any>, key: string) {
  const raw = obj[key];
  if (typeof raw !== 'string') return raw;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Họ tên người dùng (1-100 ký tự, không null)',
    example: 'Nguyễn Văn A',
  })
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ obj, key }) => trimRawString(obj, key))
  @IsString({ message: 'Họ tên phải là chuỗi' })
  @Length(1, 100, { message: 'Họ tên phải từ 1 đến 100 ký tự' })
  full_name?: string;

  @ApiPropertyOptional({
    description: 'Giới thiệu bản thân (tối đa 500 ký tự, hoặc null để xóa)',
    example: 'Đam mê du lịch và khám phá văn hóa bản địa',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(({ obj, key }) => trimToNullIfEmpty(obj, key))
  @IsString({ message: 'Giới thiệu phải là chuỗi' })
  @MaxLength(500, { message: 'Giới thiệu tối đa 500 ký tự' })
  bio?: string | null;

  @ApiPropertyOptional({
    description: 'Số điện thoại Việt Nam (0xxxxxxxxx hoặc +84xxxxxxxxx, hoặc null để xóa)',
    example: '0912345678',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(({ obj, key }) => trimToNullIfEmpty(obj, key))
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @Matches(/^(0|\+84)\d{9}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone_number?: string | null;

  @ApiPropertyOptional({
    description: 'URL ảnh đại diện HTTPS (tối đa 2048 ký tự, hoặc null để xóa)',
    example: 'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(({ obj, key }) => trimRawString(obj, key))
  @IsString({ message: 'URL ảnh đại diện phải là chuỗi' })
  @MaxLength(2048, { message: 'URL ảnh đại diện tối đa 2048 ký tự' })
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'URL ảnh đại diện phải là liên kết HTTPS hợp lệ' },
  )
  avatar_url?: string | null;
}
