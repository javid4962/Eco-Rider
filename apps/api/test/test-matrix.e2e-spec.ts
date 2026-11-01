import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TestMatrixController } from '../src/modules/test-matrix/test-matrix.controller';
import { TestMatrixService } from '../src/modules/test-matrix/test-matrix.service';

describe('Test Matrix Integration (e2e)', () => {
  let app: INestApplication;
  let controller: TestMatrixController;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestMatrixController],
      providers: [TestMatrixService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    controller = app.get<TestMatrixController>(TestMatrixController);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /test-matrix returns all 12 requirement mappings', () => {
    const res = controller.getAllMappings();
    expect(res).toHaveProperty('mappings');
    expect(res.mappings).toHaveLength(12);
  });

  it('GET /test-matrix?category=concurrency returns filtered concurrency mappings', () => {
    const res = controller.getAllMappings('concurrency');
    expect(res).toHaveProperty('mappings');
    expect(res.mappings.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /test-matrix/summary returns executive metrics', () => {
    const res = controller.getSummary();
    expect(res).toHaveProperty('summary');
    expect(res.summary.totalRequirements).toBe(12);
    expect(res.summary.p0Count).toBe(10);
    expect(res.summary.releaseBlockersCount).toBe(10);
    expect(res.summary.complianceCount).toBe(2);
    expect(res.summary.financialCount).toBe(2);
  });

  it('GET /test-matrix/p0-blockers returns only P0 release-blocking requirements', () => {
    const res = controller.getP0Blockers();
    expect(res).toHaveProperty('blockers');
    expect(res.blockers).toHaveLength(10);
    expect(res.blockers.every((b) => b.isReleaseBlocker)).toBe(true);
  });

  it('GET /test-matrix/coverage-validation confirms 100% P0 coverage and zero unassigned owners', () => {
    const res = controller.validateCoverage();
    expect(res.valid).toBe(true);
    expect(res.uncoveredP0Count).toBe(0);
    expect(res.unassignedOwners).toEqual([]);
    expect(res.missingBlockers).toEqual([]);
  });

  it('GET /test-matrix?category=invalid throws 400 Bad Request', () => {
    expect(() => controller.getAllMappings('invalid_category')).toThrow();
  });
});

