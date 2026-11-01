import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { QuotesController } from '../src/modules/quotes/quotes.controller';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { RedisService } from '../src/modules/redis/redis.service';

describe('API Contracts & OpenAPI (E2E Integration)', () => {
  let app: INestApplication;
  let quotesController: QuotesController;

  beforeAll(async () => {
    const mockDataSource = {
      isInitialized: true,
      query: jest.fn().mockResolvedValue([]),
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    const mockRedisService = {
      getClient: jest.fn().mockReturnValue({
        ping: jest.fn().mockResolvedValue('PONG'),
        quit: jest.fn().mockResolvedValue('OK'),
      }),
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(mockDataSource)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health'] });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    quotesController = app.get<QuotesController>(QuotesController);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Quotes Controller & DTO Validation', () => {
    it('should calculate valid electric ride quote in Visakhapatnam', () => {
      const result = quotesController.calculateQuote({
        city: 'visakhapatnam',
        serviceCategory: 'CITY_COMMUTE_2W',
        pickupLatitude: 17.6868,
        pickupLongitude: 83.2185,
        dropoffLatitude: 17.7275,
        dropoffLongitude: 83.3038,
      });

      expect(result.quoteId).toBeDefined();
      expect(result.city).toBe('visakhapatnam');
      expect(result.fare.amountPaise).toBeGreaterThan(2500);
      expect(result.fare.currency).toBe('INR');
      expect(result.propulsion).toBe('BATTERY_ELECTRIC');
    });

    it('should reject quotes for cities outside Release A pilot', () => {
      expect(() => {
        quotesController.calculateQuote({
          city: 'tirupati',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 13.6288,
          pickupLongitude: 79.4192,
          dropoffLatitude: 13.635,
          dropoffLongitude: 79.425,
        });
      }).toThrow();
    });
  });

  describe('OpenAPI 3.0 Document Generation', () => {
    it('should generate complete OpenAPI specification with /v1 endpoints and security schemes', () => {
      const swaggerConfig = new DocumentBuilder()
        .setTitle('EcoRide EV Mobility API')
        .setDescription('OpenAPI 3.0 specification for EcoRide')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, swaggerConfig);

      expect(document.openapi).toMatch(/^3\./);
      expect(document.info.title).toBe('EcoRide EV Mobility API');
      expect(document.paths['/v1/quotes']).toBeDefined();
      expect(document.paths['/v1/quotes'].post).toBeDefined();
      expect(document.paths['/health']).toBeDefined();
      expect(document.components?.securitySchemes?.bearer).toBeDefined();
    });
  });
});
