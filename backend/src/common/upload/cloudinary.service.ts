import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface FileToUpload {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(file: FileToUpload, folder = 'wanderflow'): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: 'auto' }, (error, result) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload error:', error);
            return reject(error || new Error('Upload failed without result'));
          }
          resolve(result.secure_url);
        })
        .end(file.buffer);
    });
  }
}
