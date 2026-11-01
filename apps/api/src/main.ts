import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  app.enableShutdownHooks();

  const configService = app.get(ConfigService<AppConfig, true>);
  const port = configService.get('port', { infer: true }) || 3000;
  const serviceName = configService.get('serviceName', { infer: true }) || 'ecoride-api';

  await app.listen(port);
  logger.log(`${serviceName} is running on port ${port}`);
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', err instanceof Error ? err.stack : String(err));
  process.exit(1);
});

