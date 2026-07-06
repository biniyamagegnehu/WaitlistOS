import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter';

function normalizeOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  return value.trim().replace(/\/$/, '');
}

function getAllowedOrigins(): string[] {
  const origins = new Set<string>([
    'http://localhost:3001',
    'http://localhost:3000',
  ]);

  const add = (value: string | undefined) => {
    const normalized = normalizeOrigin(value);
    if (normalized) origins.add(normalized);
  };

  add(process.env.FRONTEND_URL);

  if (process.env.CORS_ORIGINS) {
    for (const part of process.env.CORS_ORIGINS.split(',')) {
      add(part);
    }
  }

  return [...origins];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.setGlobalPrefix('api');

  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalized = normalizeOrigin(origin);
      if (normalized && allowedOrigins.includes(normalized)) {
        callback(null, origin);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Cookies (still needed for some backward compatibility or edge cases, 
  // though auth now uses Authorization headers)
  app.use(cookieParser());

  // Global Exception Filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
