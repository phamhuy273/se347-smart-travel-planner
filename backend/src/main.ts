import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3000;
  const prefix = process.env.API_PREFIX || 'api/v1';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // 1. Enable CORS for Vue 3 Frontend
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // 2. Set Global API Prefix
  app.setGlobalPrefix(prefix);

  // 3. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 4. Global Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // 5. Swagger Interactive UI Documentation (Xem & Test API trực quan trên web)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TripPlanner (Wanderflow) API - Module 3')
    .setDescription(
      '🌟 Giao diện trực quan kiểm thử tương tác API hệ thống Lập lịch trình & Bản đồ Mapbox (SE347)\n\n' +
        '💡 HƯỚNG DẪN BẤM TEST DỄ DÀNG CHO BẠN:\n' +
        '• Khi đang ở môi trường phát triển (Local Dev), hệ thống đã bật chế độ hỗ trợ kiểm thử: bạn có thể bấm "Try it out" ➔ "Execute" trực tiếp trên bất kỳ API nào bên dưới!\n' +
        '• Hoặc bấm vào nút "Authorize" (hình ổ khóa 🔓 ở góc trên bên phải) và nhập chữ "test" để kích hoạt quyền Chủ chuyến đi (Owner) thử nghiệm.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập access token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`🚀 Wanderflow Backend API: http://localhost:${port}/${prefix}`);
  logger.log(`📖 Swagger UI (Giao diện API): http://localhost:${port}/api/docs`);
  logger.log(`🌐 CORS enabled for Frontend URL: ${frontendUrl}`);
  logger.log(`=======================================================`);
}


bootstrap();
