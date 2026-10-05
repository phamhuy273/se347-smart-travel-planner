import { Controller } from '@nestjs/common';
import { PlacesService } from './places.service';

@Controller()
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  // --- Giai đoạn 3: Các endpoint CRUD sẽ được khai báo tại đây ---
  // --- Giai đoạn 5: Endpoint Reorder kéo thả sẽ được khai báo tại đây ---
}
