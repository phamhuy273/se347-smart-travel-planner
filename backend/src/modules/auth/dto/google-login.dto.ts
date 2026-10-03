import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class GoogleLoginDto {
  @IsNotEmpty({ message: 'Token Google không được để trống' })
  @IsString()
  credential: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}
