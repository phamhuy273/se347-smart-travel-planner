import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { UploadController } from './upload.controller';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadModule {}
