import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GreenBondReportingService } from '../src/modules/green-bond-reporting/green-bond-reporting.service';
import { GreenBondReportingController } from '../src/modules/green-bond-reporting/green-bond-reporting.controller';
import { GreenBondAuditReportEntity } from '../src/database/entities/green-bond-audit-report.entity';
import { GreenBondAuditStatus } from '@ecoride/contracts';

describe('GreenBondReportingModule', () => {
  let service: GreenBondReportingService;
  let controller: GreenBondReportingController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-report-uuid',
      auditedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-report-uuid') {
        return {
          id: 'mock-report-uuid',
          reportingPeriod: 'FY-2026-Q3',
          bondSeriesId: 'APUIIDC-GREEN-BOND-2026',
          status: GreenBondAuditStatus.CAG_AUDITED,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GreenBondReportingController],
      providers: [
        GreenBondReportingService,
        {
          provide: getRepositoryToken(GreenBondAuditReportEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<GreenBondReportingService>(GreenBondReportingService);
    controller = module.get<GreenBondReportingController>(GreenBondReportingController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should generate verifiable ESG green bond report with avoided CO2 and SHA-256 certificate', async () => {
    const report = await controller.generate({
      reportingPeriod: 'FY-2026-Q3',
      bondSeriesId: 'APUIIDC-GREEN-BOND-2026',
      totalCleanKmTraveled: 4200000.0, // 4.2M km
      totalKwhConsumed: 700000.0,
      solarWindSharePercent: 68.5,
      capitalExpenditurePaise: 50000000000, // ₹50 Cr
      bondProceedsAllocatedPaise: 50000000000,
      greenJobsGeneratedCount: 350,
    });

    expect(report.displacedDieselLiters).toBe(1000000.0); // 4.2M km / 4.2 = 1M L
    expect(report.avoidedCo2EmissionsMetricTons).toBe(2680.0); // 1M * 2.68 / 1000 = 2680 MT
    expect(report.complianceRatioBps).toBe(10000); // 100%
    expect(report.status).toBe(GreenBondAuditStatus.CAG_AUDITED);
    expect(report.tamperProofCertificateSha256).toHaveLength(64);
  });

  it('should retrieve green bond report by id', async () => {
    const result = await controller.getById('mock-report-uuid');
    expect(result.id).toBe('mock-report-uuid');
    expect(result.bondSeriesId).toBe('APUIIDC-GREEN-BOND-2026');
  });
});

