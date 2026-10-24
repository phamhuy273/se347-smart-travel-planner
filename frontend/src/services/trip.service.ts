import apiClient from './api.client';
import type { UnsplashPhoto } from '@/types/trip';

export interface CreatedTrip {
  id?: string | number;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  coverURL?: string;
}

// TODO: đổi endpoint cho khớp backend thật
export const createTrip = (formData: FormData) =>
  apiClient.post('/trips', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as unknown as Promise<{ trip: CreatedTrip }>;

export const searchCoverPhotos = (query: string) =>
  apiClient.get('/unsplash', { params: { query } }) as unknown as Promise<{ photos: UnsplashPhoto[] }>;