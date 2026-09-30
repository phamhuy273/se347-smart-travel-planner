import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
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

  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`🚀 Wanderflow Backend API is running on: http://localhost:${port}/${prefix}`);
  logger.log(`🌐 CORS enabled for Frontend URL: ${frontendUrl}`);
  logger.log(`=======================================================`);
}

bootstrap();
