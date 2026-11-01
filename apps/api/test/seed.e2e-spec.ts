import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { SeedController } from '../src/modules/seed/seed.controller';

describe('Seed & Mock Providers (E2E Integration)', () => {
  let app: INestApplication;
  let seedController: SeedController;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health'] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    seedController = app.get(SeedController);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /v1/seed/status should return current seed overview', async () => {
    const status = await seedController.getStatus();

    expect(status).toHaveProperty('usersCount');
    expect(status).toHaveProperty('vehiclesCount');
    expect(status).toHaveProperty('zonesCount');
    expect(status).toHaveProperty('serviceFlagsCount');
    expect(status).toHaveProperty('bookingsCount');
    expect(status).toHaveProperty('ledgerEntriesCount');
    expect(['SEEDED', 'EMPTY', 'PARTIAL']).toContain(status.status);
  });

  it('POST /v1/seed/run should idempotently seed synthetic EV mobility data', async () => {
    const status = await seedController.runSeed();

    expect(status.status).toBe('SEEDED');
    expect(status.usersCount).toBeGreaterThanOrEqual(11);
    expect(status.vehiclesCount).toBeGreaterThanOrEqual(5);
    expect(status.zonesCount).toBeGreaterThanOrEqual(4);
    expect(status.serviceFlagsCount).toBeGreaterThanOrEqual(6);
  });

  it('POST /v1/seed/reset should cleanly wipe and re-seed demo data', async () => {
    const status = await seedController.resetSeed();

    expect(status.status).toBe('SEEDED');
    expect(status.bookingsCount).toBe(3);
    expect(status.ledgerEntriesCount).toBe(3);
  });
});

