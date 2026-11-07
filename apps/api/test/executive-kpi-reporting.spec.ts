import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExecutiveKpiReportingService } from '../src/modules/executive-kpi-reporting/executive-kpi-reporting.service';
import { ExecutiveKpiSnapshot } from '../src/database/entities/executive-kpi-snapshot.entity';

describe('ExecutiveKpiReportingService (M110)', () => {
  let service: ExecutiveKpiReportingService;
  let repo: Partial<Record<keyof Repository<ExecutiveKpiSnapshot>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-kpi-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutiveKpiReportingService,
        {
          provide: getRepositoryToken(ExecutiveKpiSnapshot),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<ExecutiveKpiReportingService>(ExecutiveKpiReportingService);
  });

  it('should generate signed regulatory KPI report with AP statutory GST breakdown and zero emissions', async () => {
    repo.findOne = jest.fn().mockResolvedValue(null);

    const report = await service.generateDailyReport({
      reportDate: '2026-11-06',
      auditorId: 'AP-STA-AUDITOR-01',
    });

    expect(report.reportDate).toBe('2026-11-06');
    expect(report.totalZeroEmissionKm).toBeGreaterThan(10000);
    expect(report.totalPassengersMoved).toBeGreaterThan(3000);
    expect(report.activeGreenPlateVehicles).toBe(245);
    expect(report.co2AvoidedKg).toBeCloseTo(2988.98, 1);
    expect(report.totalGstCollectedPaise.passenger5PercentSac996412).toBe(215000);
    expect(report.totalGstCollectedPaise.cargo18PercentSac9965).toBe(142000);
    expect(report.totalGstCollectedPaise.services18PercentSac9987).toBe(64000);
    expect(report.totalGstCollectedPaise.totalPaise).toBe(421000); // ₹4,210.00
    expect(report.safetyIncidentRatePerMillionKm).toBe(0.0);
    expect(report.cryptographicSignature).toBeDefined();
    expect(report.cryptographicSignature).toHaveLength(64); // HMAC-SHA256 hex string
    expect(repo.save).toHaveBeenCalled();
  });
});

