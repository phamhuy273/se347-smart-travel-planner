import { Injectable, ParseUUIDPipe, ArgumentMetadata } from '@nestjs/common';

/**
 * Pipe thông minh tự động cắt bỏ khoảng trắng hoặc ký tự tab vô tình bị copy thừa
 * trước khi kiểm tra định dạng UUID.
 */
@Injectable()
export class TrimmedUUIDPipe extends ParseUUIDPipe {
  async transform(value: string, metadata: ArgumentMetadata): Promise<string> {
    const cleanValue = typeof value === 'string' ? value.trim() : value;
    return super.transform(cleanValue, metadata);
  }
}
