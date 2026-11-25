import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { PASSWORD_REGEX } from './register.dto';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString()
  @Length(6, 6, { message: 'Mã OTP phải gồm chính xác 6 chữ số' })
  otp: string;

  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi' })
  @Length(8, 100, { message: 'Mật khẩu mới phải có tối thiểu 8 ký tự' })
  @Matches(PASSWORD_REGEX, {
    message:
      'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt',
  })
  new_password: string;
}
