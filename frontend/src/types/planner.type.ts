export type PlaceCategory =
  | 'ATTRACTION'
  | 'RESTAURANT'
  | 'HOTEL'
  | 'TRANSPORT'
  | 'OTHER'
  | 'FOOD'
  | 'SIGHTSEEING';

export interface PlaceItem {
  id: string;
  tripId: string;
  tripDayId: string | null; // null = Unassigned (Kho lưu tạm)
  placeName: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
  thumbnailUrl?: string;
  category: PlaceCategory;
  startTime?: string;
  durationMinutes?: number;
  notes?: string;
  orderIndex: number;
}

export interface TripDay {
  id: string;
  tripId: string;
  dayNumber: number;
  date: string;
  places: PlaceItem[];
}

export interface SearchPlaceResult {
  id: string;
  placeName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  thumbnailUrl?: string;
  category: PlaceCategory;
}

export interface ReorderPlacePayload {
  target_day_id: string | null;
  prev_order_index: number | null;
  next_order_index: number | null;
}

