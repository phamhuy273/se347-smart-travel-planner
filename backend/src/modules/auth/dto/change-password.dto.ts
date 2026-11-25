import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { PASSWORD_REGEX } from './register.dto';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mật khẩu hiện tại' })
  @Transform(({ obj, key }) => obj[key])
  @IsString({ message: 'Mật khẩu hiện tại phải là chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
  current_password: string;

  @ApiProperty({
    description:
      'Mật khẩu mới (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt)',
  })
  @Transform(({ obj, key }) => obj[key])
  @IsString({ message: 'Mật khẩu mới phải là chuỗi' })
  @Length(8, 100, { message: 'Mật khẩu mới phải có tối thiểu 8 ký tự' })
  @Matches(PASSWORD_REGEX, {
    message:
      'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt',
  })
  new_password: string;
}
