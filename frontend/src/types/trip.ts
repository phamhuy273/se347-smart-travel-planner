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