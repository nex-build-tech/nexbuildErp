import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { APP_NAME, API_PREFIX } from '@builderp/shared';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Pino logger replaces NestJS default logger
    bufferLogs: true,
  });

  // ── Pino logger ────────────────────────────────────────────────────────
  app.useLogger(app.get(Logger));

  // ── Security middleware ────────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // ── CORS ───────────────────────────────────────────────────────────────
  const config = app.get(ConfigService);
  const corsOrigin = config.get<string>('app.corsOrigin') ?? 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant', 'X-Tenant-Slug'],
  });

  // ── Global prefix ──────────────────────────────────────────────────────
  app.setGlobalPrefix(API_PREFIX, {
    exclude: ['/'],
  });

  // ── Global pipes ───────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global interceptors ────────────────────────────────────────────────
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  // ── Global filters (order: specific → general) ─────────────────────────
  app.useGlobalFilters(new AllExceptionFilter(), new HttpExceptionFilter());

  // ── Swagger ────────────────────────────────────────────────────────────
  const swaggerEnabled = config.get<boolean>('app.swaggerEnabled') ?? false;
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(`${APP_NAME} API`)
      .setDescription('REST API for the BuildERP multi-tenant ERP platform')
      .setVersion('0.1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addServer('http://localhost:3000', 'Local development')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // ── Start server ───────────────────────────────────────────────────────
  const port = config.get<number>('app.port') ?? 3000;
  await app.listen(port, '0.0.0.0');

  const pinoLogger = app.get(Logger);
  pinoLogger.log(`🚀  ${APP_NAME} API listening on http://localhost:${port}`);
  pinoLogger.log(`📋  Health: http://localhost:${port}/${API_PREFIX}/health`);
  if (swaggerEnabled) {
    pinoLogger.log(`📖  Swagger: http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
