import apiClient from './api.client';
import type { CreateTripPayload, Trip, UnsplashPhoto } from '@/types/trip';

export interface CreatedTrip {
  id?: string | number;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  coverURL?: string;
}

export const createTrip = (payload: CreateTripPayload | FormData) => {
  if (payload instanceof FormData) {
    return apiClient.post('/trips', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return apiClient.post('/trips', payload);
};

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const response: any = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response?.data?.url || response?.url || '';
};

export const getTrips = (params?: { tab?: string; search?: string }) =>
  apiClient.get('/trips', { params });

export const getTripById = (id: string) => apiClient.get(`/trips/${id}`);

export const updateTrip = (id: string, data: any) => apiClient.patch(`/trips/${id}`, data);

export const deleteTrip = (id: string) => apiClient.delete(`/trips/${id}`);

export const getUpcomingTrip = () => apiClient.get('/trips/upcoming');

export const searchCoverPhotos = (query: string) =>
  apiClient.get('/unsplash', { params: { query } }) as unknown as Promise<{ photos: UnsplashPhoto[] }>;
