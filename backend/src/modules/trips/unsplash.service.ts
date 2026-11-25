import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const UNSPLASH_SEARCH_URL = 'https://api.unsplash.com/search/photos';
const UNSPLASH_TIMEOUT_MS = 3000;

@Injectable()
export class UnsplashService {
  private readonly logger = new Logger(UnsplashService.name);

  constructor(
    @Optional() @Inject(ConfigService) private readonly configService?: ConfigService,
  ) {}

  buildDestinationQuery(destination: string): string {
    const beforeComma = (destination || '').split(',')[0] ?? '';
    return beforeComma
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private isAllowedImageUrl(rawUrl: unknown): rawUrl is string {
    if (typeof rawUrl !== 'string' || !rawUrl.startsWith('https://images.unsplash.com/')) {
      return false;
    }
    try {
      const parsed = new URL(rawUrl);
      return parsed.protocol === 'https:' && parsed.hostname === 'images.unsplash.com';
    } catch {
      return false;
    }
  }

  private triggerDownloadTracking(
    downloadLocation: unknown,
    headers: Record<string, string>,
  ) {
    if (typeof downloadLocation !== 'string') return;

    try {
      const parsed = new URL(downloadLocation);
      if (parsed.protocol !== 'https:' || parsed.hostname !== 'api.unsplash.com') {
        return;
      }

      Promise.resolve(
        fetch(downloadLocation, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(UNSPLASH_TIMEOUT_MS),
        }),
      ).catch(() => {
        this.logger.warn('Không thể ghi nhận download_location Unsplash');
      });
    } catch {
      // Bỏ qua URL download_location không hợp lệ
    }
  }

  async findCover(destination: string): Promise<string | null> {
    try {
      const accessKey = (
        this.configService?.get<string>('UNSPLASH_ACCESS_KEY') ??
        process.env.UNSPLASH_ACCESS_KEY ??
        ''
      ).trim();

      if (!accessKey) {
        this.logger.warn('Thiếu UNSPLASH_ACCESS_KEY, bỏ qua lấy ảnh bìa tự động');
        return null;
      }

      const query = this.buildDestinationQuery(destination);
      if (!query) {
        return null;
      }

      const params = new URLSearchParams({
        query,
        per_page: '1',
        orientation: 'landscape',
        content_filter: 'high',
      });

      const headers = {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      };

      const response = await fetch(`${UNSPLASH_SEARCH_URL}?${params.toString()}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(UNSPLASH_TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.warn(`Unsplash API trả về HTTP ${response.status}`);
        return null;
      }

      const data: any = await response.json();
      const firstPhoto = data?.results?.[0];
      if (!firstPhoto) {
        this.logger.warn(`Không tìm thấy ảnh Unsplash phù hợp cho "${query}"`);
        return null;
      }

      const regularUrl = firstPhoto?.urls?.regular;
      if (!this.isAllowedImageUrl(regularUrl)) {
        this.logger.warn('URL ảnh trả về từ Unsplash không thuộc host hợp lệ');
        return null;
      }

      this.triggerDownloadTracking(firstPhoto?.links?.download_location, headers);
      return regularUrl;
    } catch (error: any) {
      const reason = error?.name === 'TimeoutError' ? 'timeout' : error?.message || 'lỗi không xác định';
      this.logger.warn(`Không thể lấy ảnh bìa Unsplash (${reason})`);
      return null;
    }
  }
}
