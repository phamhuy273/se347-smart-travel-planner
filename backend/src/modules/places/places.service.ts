import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // --- Giai đoạn 3: CRUD cơ bản sẽ được triển khai tại đây ---
  // --- Giai đoạn 5: Thuật toán Fractional Indexing sẽ được triển khai tại đây ---
}
