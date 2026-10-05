import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { TripRoleGuard } from './guards/trip-role.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
  ],
  controllers: [PlacesController],
  providers: [PlacesService, TripRoleGuard],
  exports: [PlacesService, TripRoleGuard],
})
export class PlacesModule {}
