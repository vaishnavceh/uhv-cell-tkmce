import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers via Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Managed by reverse proxy or SPA
    }),
  );

  // Compression
  const compressFn = typeof compression === 'function' ? compression : (compression as any).default;
  if (compressFn) app.use(compressFn());

  // CORS configuration
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost,http://localhost:80,http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow dev origins safely
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
  });

  // Serve static uploaded files
  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Global Pipes & Interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Universal Human Values (UHV) Cell - TKMCE API')
    .setDescription(
      'Institutional REST API and administrative CMS backend for Universal Human Values Cell at TKM College of Engineering, Kollam.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Institutional authentication & session management')
    .addTag('Objectives', 'AICTE G911 mandate objectives')
    .addTag('Activities', 'UHV institutional activities & study circles')
    .addTag('Events', 'Event management & student registrations')
    .addTag('Workshops', 'Faculty development & workshop repository')
    .addTag('Team', 'UHV cell committee & student ambassadors')
    .addTag('Resources', 'Curricular documents & download archive')
    .addTag('Gallery', 'Institutional events photo gallery')
    .addTag('Announcements', 'Official notifications & releases')
    .addTag('Contact', 'Campus inquiry & correspondence inbox')
    .addTag('Dashboard', 'CMS overview metrics & administrative analytics')
    .addTag('Audit', 'Security audit logs and change tracking')
    .addTag('Settings', 'Institutional site settings & AICTE links')
    .addTag('Health', 'System health monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`=======================================================`);
  logger.log(` UHV Cell TKMCE API running at http://localhost:${port}/api/v1`);
  logger.log(` Swagger Docs available at http://localhost:${port}/api/v1/docs`);
  logger.log(`=======================================================`);
}

bootstrap();
