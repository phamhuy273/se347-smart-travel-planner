export interface Trip {
  id?: string;
  title: string;
  dates?: string;
  duration?: string;
  members?: number;
  location?: string;
  destination?: string;
  author?: string;
  owner?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  image?: string;
  cover_image_url?: string;
  status?: string;
  secondary?: 'Của tôi' | 'Đã lưu';
  start_date?: string;
  end_date?: string;
  description?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  _count?: {
    days?: number;
    place_items?: number;
    likes?: number;
    bookmarks?: number;
  };
  days?: Array<{ id: string; trip_id: string; day_number: number; date: string }>;
}

export interface CreateTripPayload {
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  description?: string;
  cover_image_url?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
}

export interface UnsplashPhoto {
  id: string;
  alt: string;
  author: string;
  authorUrl: string;
  downloadLocation: string;
  regular: string;
  thumb: string;
}