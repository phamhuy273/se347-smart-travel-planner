import 'reflect-metadata';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TripVisibility, UserRole } from '@prisma/client';
import request from 'supertest';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../auth/mail.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { PlacesController } from '../places/places.controller';
import { PlacesService } from '../places/places.service';
import { TripRoleGuard } from '../places/guards/trip-role.guard';
import { ChecklistsModule } from './checklists.module';
import { ChecklistsController } from './checklists.controller';
import {
  CreateChecklistDto,
  GetChecklistsQueryDto,
  UpdateChecklistDto,
} from './dto';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../../common/filters/http-exception.filter';

// Vitest uses esbuild which strips emitDecoratorMetadata; restore paramtypes for NestJS DI & ValidationPipe if absent
function ensureParamTypes(target: object, paramTypes: any[]) {
  if (!Reflect.getMetadata('design:paramtypes', target)) {
    Reflect.defineMetadata('design:paramtypes', paramTypes, target);
  }
}

function ensureMethodParamTypes(proto: object, methodName: string, paramTypes: any[]) {
  if (!Reflect.getMetadata('design:paramtypes', proto, methodName)) {
    Reflect.defineMetadata('design:paramtypes', paramTypes, proto, methodName);
  }
}

ensureParamTypes(JwtStrategy, [ConfigService, PrismaService]);
ensureParamTypes(AuthService, [PrismaService, JwtService, MailService]);
ensureParamTypes(AuthController, [AuthService]);
ensureParamTypes(PlacesService, [PrismaService]);
ensureParamTypes(PlacesController, [PlacesService]);
ensureParamTypes(TripRoleGuard, [Reflector, PrismaService, JwtService, ConfigService]);
ensureMethodParamTypes(ChecklistsController.prototype, 'findAll', [
  String,
  GetChecklistsQueryDto,
]);
ensureMethodParamTypes(ChecklistsController.prototype, 'create', [
  String,
  CreateChecklistDto,
]);
ensureMethodParamTypes(ChecklistsController.prototype, 'update', [
  String,
  String,
  UpdateChecklistDto,
]);
ensureMethodParamTypes(ChecklistsController.prototype, 'remove', [String, String]);

describe('ChecklistsController (HTTP & Guards)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const originalSecret = process.env.JWT_SECRET;

  const tripId = '11111111-1111-4111-8111-111111111111';
  const itemId = '22222222-2222-4222-8222-222222222222';
  const ownerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const editorId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const viewerId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const outsiderId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

  const usersById: Record<string, any> = {
    [ownerId]: { id: ownerId, email: 'owner@test.com', full_name: 'Owner' },
    [editorId]: { id: editorId, email: 'editor@test.com', full_name: 'Editor' },
    [viewerId]: { id: viewerId, email: 'viewer@test.com', full_name: 'Viewer' },
    [outsiderId]: { id: outsiderId, email: 'outsider@test.com', full_name: 'Outsider' },
  };

  let mockPrisma: any;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-checklist-jwt-secret';

    mockPrisma = {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      user: {
        findUnique: vi.fn(({ where }: any) =>
          Promise.resolve(usersById[where.id] ?? null),
        ),
      },
      trip: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      tripMember: {
        findUnique: vi.fn(),
      },
      tripChecklist: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
        ChecklistsModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app?.close();
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockImplementation(({ where }: any) =>
      Promise.resolve(usersById[where.id] ?? null),
    );
    mockPrisma.trip.findUnique.mockResolvedValue({
      id: tripId,
      owner_id: ownerId,
      visibility: TripVisibility.PUBLIC,
      is_deleted: false,
    });
    mockPrisma.trip.findFirst.mockResolvedValue({ id: tripId });
    mockPrisma.tripMember.findUnique.mockImplementation(({ where }: any) => {
      const uid = where.trip_id_user_id?.user_id;
      if (uid === editorId) return Promise.resolve({ role: UserRole.EDITOR });
      if (uid === viewerId) return Promise.resolve({ role: UserRole.VIEWER });
      return Promise.resolve(null);
    });
    mockPrisma.tripChecklist.findMany.mockResolvedValue([
      { id: itemId, trip_id: tripId, item_name: 'Hộ chiếu', category: 'DOCUMENTS', is_checked: false, order_index: 0 },
    ]);
    mockPrisma.tripChecklist.findFirst.mockResolvedValue(null);
    mockPrisma.tripChecklist.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: itemId, ...data }),
    );
  });

  const signToken = (userId: string) =>
    jwtService.signAsync(
      { sub: userId, email: usersById[userId].email },
      { secret: 'test-checklist-jwt-secret' },
    );

  it('returns 401 when Authorization header is missing', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/trips/${tripId}/checklists`)
      .expect(401);
  });

  it('returns 401 when using backdoor token "Bearer test" or "Bearer dev"', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/trips/${tripId}/checklists`)
      .set('Authorization', 'Bearer test')
      .expect(401);

    await request(app.getHttpServer())
      .post(`/api/v1/trips/${tripId}/checklists`)
      .set('Authorization', 'Bearer dev')
      .send({ item_name: 'Hộ chiếu' })
      .expect(401);
  });

  it('allows VIEWER to GET (200) but denies VIEWER from POST (403)', async () => {
    const token = await signToken(viewerId);

    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/trips/${tripId}/checklists`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(getRes.body.data)).toBe(true);

    await request(app.getHttpServer())
      .post(`/api/v1/trips/${tripId}/checklists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ item_name: 'Kem chống nắng' })
      .expect(403);
  });

  it('denies outsider (403) even when trip is PUBLIC', async () => {
    const token = await signToken(outsiderId);

    await request(app.getHttpServer())
      .get(`/api/v1/trips/${tripId}/checklists`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('allows OWNER and EDITOR to create checklist item (201) and rejects invalid boolean "false" (400)', async () => {
    const editorToken = await signToken(editorId);

    const createRes = await request(app.getHttpServer())
      .post(`/api/v1/trips/${tripId}/checklists`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ item_name: '  Thuốc cảm  ', category: 'MEDICAL' })
      .expect(201);

    expect(createRes.body.data.item_name).toBe('Thuốc cảm');
    expect(createRes.body.data.category).toBe('MEDICAL');

    await request(app.getHttpServer())
      .patch(`/api/v1/trips/${tripId}/checklists/${itemId}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ is_checked: 'false' })
      .expect(400);
  });
});
