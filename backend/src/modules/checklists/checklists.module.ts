import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlacesModule } from '../places/places.module';
import { ChecklistsController } from './checklists.controller';
import { ChecklistsService } from './checklists.service';

@Module({
  imports: [AuthModule, PlacesModule],
  controllers: [ChecklistsController],
  providers: [ChecklistsService],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
