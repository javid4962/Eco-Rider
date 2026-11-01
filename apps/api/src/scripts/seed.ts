import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from '../modules/seed/seed.service';

async function bootstrap() {
  const isReset = process.argv.includes('--reset');
  console.log(`[Seed CLI] Starting synthetic data provisioning (reset mode: ${isReset})...`);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const seedService = app.get(SeedService);
    const result = isReset ? await seedService.resetSeed() : await seedService.seedAll();

    console.log('[Seed CLI] Seed finished successfully:');
    console.table(result);
  } catch (error) {
    console.error('[Seed CLI] Failed to seed synthetic data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();

