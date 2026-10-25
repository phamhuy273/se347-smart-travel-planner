import axios from 'axios';
import type { PlaceItem, SearchPlaceResult, ReorderPlacePayload } from '@/types/planner.type';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const placeService = {
  // 1. Fetch Full Itinerary
  async getTripItinerary(tripId: string) {
    const response = await axios.get(`${API_BASE_URL}/trips/${tripId}/full-itinerary`);
    return response.data?.data || response.data;
  },

  // 2. Search places via Mapbox / Backend with AbortSignal support
  async searchPlaces(query: string, signal?: AbortSignal): Promise<SearchPlaceResult[]> {
    if (!query.trim()) return [];
    try {
      const response = await axios.get(`${API_BASE_URL}/places/search`, {
        params: { q: query },
        signal,
      });
      return response.data?.data || response.data;
    } catch (err: any) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.name === 'AbortError') {
        throw err; // Let caller know request was canceled
      }
      // Fallback mock search results if backend is not running yet
      return [
        {
          id: `search-${Date.now()}-1`,
          placeName: `${query} - Điểm Check-in Nổi Bật`,
          formattedAddress: 'Đường Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng',
          latitude: 16.06,
          longitude: 108.22,
          category: 'ATTRACTION',
        },
        {
          id: `search-${Date.now()}-2`,
          placeName: `Nhà Hàng Đặc Sản (${query})`,
          formattedAddress: 'Phố Cổ Hội An, Quảng Nam',
          latitude: 15.88,
          longitude: 108.33,
          category: 'RESTAURANT',
        },
      ];
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
    const response = await axios.post(`${API_BASE_URL}/trips/${tripId}/places`, payload);
    return response.data?.data || response.data;
  },

  // 4. Update Place Details
  async updatePlace(placeId: string, updates: Partial<PlaceItem>): Promise<PlaceItem> {
    const payload: Record<string, any> = {};
    if (updates.startTime !== undefined) payload.start_time = updates.startTime;
    if (updates.durationMinutes !== undefined) payload.duration_minutes = updates.durationMinutes;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.category !== undefined) payload.category = updates.category;

    const response = await axios.patch(`${API_BASE_URL}/places/${placeId}`, payload);
    return response.data?.data || response.data;
  },

  // 5. Reorder place (PATCH Fractional Indexing O(1))
  async reorderPlace(placeId: string, payload: ReorderPlacePayload): Promise<any> {
    const response = await axios.patch(`${API_BASE_URL}/places/${placeId}/reorder`, payload);
    return response.data?.data || response.data;
  },

  // 6. Delete place
  async deletePlace(placeId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/places/${placeId}`);
  },
};
