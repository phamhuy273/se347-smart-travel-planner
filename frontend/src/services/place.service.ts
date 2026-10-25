import apiClient from './api.client';
import axios from 'axios';
import type { PlaceItem, SearchPlaceResult, ReorderPlacePayload } from '@/types/planner.type';

export const placeService = {
  // 1. Fetch Full Itinerary (các ngày, địa điểm đã sắp xếp, kho lưu tạm)
  async getTripItinerary(tripId: string) {
    const response: any = await apiClient.get(`/trips/${tripId}/itinerary`);
    return response?.data || response;
  },

  // 2. Search places via Mapbox / Backend with AbortSignal support
  async searchPlaces(query: string, signal?: AbortSignal): Promise<SearchPlaceResult[]> {
    if (!query.trim()) return [];
    try {
      const response: any = await apiClient.get('/places/search', {
        params: { q: query },
        signal,
      });
      return response?.data || response;
    } catch (err: any) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.name === 'AbortError') {
        throw err;
      }
      return [];
    }
  },

  // 3. Add place to trip day or unassigned pool
  async addPlace(tripId: string, placeData: Partial<PlaceItem>): Promise<PlaceItem> {
    const payload = {
      trip_day_id: placeData.tripDayId || null,
      place_name: placeData.placeName,
      formatted_address: placeData.formattedAddress,
      latitude: placeData.latitude,
      longitude: placeData.longitude,
      thumbnail_url: placeData.thumbnailUrl,
      category: placeData.category,
      start_time: placeData.startTime,
      duration_minutes: placeData.durationMinutes,
      notes: placeData.notes,
    };
    const response: any = await apiClient.post(`/trips/${tripId}/places`, payload);
    return response?.data || response;
  },

  // 4. Update Place Details
  async updatePlace(placeId: string, updates: Partial<PlaceItem>): Promise<PlaceItem> {
    const payload: Record<string, any> = {};
    if (updates.startTime !== undefined) payload.start_time = updates.startTime;
    if (updates.durationMinutes !== undefined) payload.duration_minutes = updates.durationMinutes;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.category !== undefined) payload.category = updates.category;

    const response: any = await apiClient.patch(`/places/${placeId}`, payload);
    return response?.data || response;
  },

  // 5. Reorder place (PATCH Fractional Indexing O(1))
  async reorderPlace(placeId: string, payload: ReorderPlacePayload): Promise<any> {
    const response: any = await apiClient.patch(`/places/${placeId}/reorder`, payload);
    return response?.data || response;
  },

  // 6. Delete place
  async deletePlace(placeId: string): Promise<void> {
    await apiClient.delete(`/places/${placeId}`);
  },
};
