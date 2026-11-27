import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { UnsplashService } from './unsplash.service';

@Module({
  imports: [AuthModule],
  controllers: [TripsController],
  providers: [TripsService, UnsplashService],
  exports: [TripsService],
})
export class TripsModule {}
