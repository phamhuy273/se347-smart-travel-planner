import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum TripTab {
  MINE = 'mine',
  ALL = 'all',
  SAVED = 'saved',
}

export class GetTripsQueryDto {
  @IsOptional()
  @IsEnum(TripTab, { message: 'Tab không hợp lệ' })
  tab?: TripTab = TripTab.ALL;

  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;
}
