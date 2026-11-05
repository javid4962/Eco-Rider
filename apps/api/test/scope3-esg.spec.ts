import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Scope3EsgService } from '../src/modules/scope3-esg/scope3-esg.service';
import { Scope3EsgController } from '../src/modules/scope3-esg/scope3-esg.controller';
import { CorporateScope3Report } from '../src/database/entities/corporate-scope3-report.entity';

describe('Scope3EsgService (M55)', () => {
  let service: Scope3EsgService;
  let mockReportRepo: any;

  beforeEach(async () => {
    mockReportRepo = {
      create: jest.fn((e) => ({ ...e, id: 'rep-123', generatedAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [Scope3EsgController],
      providers: [
        Scope3EsgService,
        { provide: getRepositoryToken(CorporateScope3Report), useValue: mockReportRepo },
      ],
    }).compile();

    service = module.get<Scope3EsgService>(Scope3EsgService);
  });

  it('should generate ISO 14064 compliant Scope-3 GHG emissions report with SHA-256 certificate hash', async () => {
    const report = await service.generateReport({
      corporateAccountId: 'c0000000-0000-4000-8000-000000000001',
      reportingPeriod: '2026-Q3',
    });

    expect(report.totalElectricTrips).toBeGreaterThan(0);
    expect(report.evEmissionsKgCo2e).toBe(0); // Zero direct tailpipe emissions
    expect(report.netScope3EmissionsAvoidedKgCo2e).toBeGreaterThan(0);
    expect(report.dieselDisplacedLiters).toBeGreaterThan(0);
    expect(report.iso14064CompliantHash).toBeDefined();
    expect(report.iso14064CompliantHash.length).toBe(64); // SHA-256 length
  });
});

