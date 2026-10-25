import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

interface UploadedMulterFile {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
  size?: number;
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file?: UploadedMulterFile) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file hợp lệ để tải lên');
    }
    const url = await this.cloudinaryService.uploadFile({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
    return { url, message: 'Tải ảnh lên thành công' };
  }
}
