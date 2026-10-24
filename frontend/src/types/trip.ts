export interface Trip {
  title: string;
  dates: string;
  duration: string;
  members: number;
  location: string;
  author: string;
  image: string;
  status: string;
  secondary?: 'Của tôi' | 'Đã lưu';
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