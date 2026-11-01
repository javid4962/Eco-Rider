import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfig } from './config/configuration';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/logging/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  app.enableShutdownHooks();

  // 1. Global /v1 URI Prefix (health probes and metrics excluded for infrastructure compatibility)
  app.setGlobalPrefix('v1', {
    exclude: ['health', 'health/(.*)', 'metrics'],
  });

  // 2. Strict Typed DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
    }),
  );

  // 3. Stable Global Error Envelope Filter & Structured Logging Interceptor
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 4. OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('EcoRide EV Mobility API')
    .setDescription(
      'Authoritative REST API for EcoRide EV-Only Mobility Platform in Andhra Pradesh',
    )
    .setVersion('1.0.0')
    .addTag('Health', 'Platform health check and dependency connectivity probes')
    .addTag('Release Boundaries', 'Gated release scopes, feature flags, and pilot zone permissions')
    .addTag('Journeys', 'User state machine flows and role-based transitions')
    .addTag('Design System', 'Original EV-only design tokens and bilingual UI parity')
    .addTag('Test Matrix', 'Traceability matrix and release blocker governance')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('v1/docs', app, document);

  const configService = app.get(ConfigService<AppConfig, true>);
  const port = configService.get('port', { infer: true }) || 3000;
  const serviceName = configService.get('serviceName', { infer: true }) || 'ecoride-api';

  await app.listen(port);
  logger.log(
    `${serviceName} is running on port ${port} (OpenAPI: http://localhost:${port}/v1/docs)`,
  );
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
