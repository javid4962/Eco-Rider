import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TestMatrixService } from '../src/modules/test-matrix/test-matrix.service';
import {
  TestCategory,
  RequirementPriority,
  RequirementType,
} from '@ecoride/contracts';

describe('TestMatrixService', () => {
  let service: TestMatrixService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestMatrixService],
    }).compile();

    service = module.get<TestMatrixService>(TestMatrixService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Requirements Traceability Matrix Completeness', () => {
    it('should contain all 12 platform requirements', () => {
      const mappings = service.getAllMappings();
      expect(mappings.length).toBe(12);

      const reqIds = mappings.map((m) => m.reqId);
      expect(reqIds).toContain('REQ-EV-01');
      expect(reqIds).toContain('REQ-EV-02');
      expect(reqIds).toContain('REQ-EV-03');
      expect(reqIds).toContain('REQ-EV-04');
      expect(reqIds).toContain('REQ-EV-05');
      expect(reqIds).toContain('REQ-EV-06');
      expect(reqIds).toContain('REQ-EV-07');
      expect(reqIds).toContain('REQ-EV-08');
      expect(reqIds).toContain('REQ-EV-09');
      expect(reqIds).toContain('REQ-EV-10');
      expect(reqIds).toContain('REQ-EV-11');
      expect(reqIds).toContain('REQ-EV-12');
    });

    it('should map requirements across all 6 test categories', () => {
      const summary = service.getSummary();

      expect(summary.categoryCoverage[TestCategory.API]).toBeGreaterThan(0);
      expect(summary.categoryCoverage[TestCategory.MOBILE]).toBeGreaterThan(0);
      expect(summary.categoryCoverage[TestCategory.ADMIN]).toBeGreaterThan(0);
      expect(summary.categoryCoverage[TestCategory.CONCURRENCY]).toBeGreaterThan(0);
      expect(summary.categoryCoverage[TestCategory.SECURITY]).toBeGreaterThan(0);
      expect(summary.categoryCoverage[TestCategory.FIELD]).toBeGreaterThan(0);
    });
  });

  describe('Release Blocker & Compliance Governance', () => {
    it('should designate ALL compliance requirements as release blockers', () => {
      const mappings = service.getAllMappings();
      const complianceReqs = mappings.filter((m) => m.type === RequirementType.COMPLIANCE);

      expect(complianceReqs.length).toBeGreaterThan(0);
      for (const req of complianceReqs) {
        expect(req.isReleaseBlocker).toBe(true);
      }
    });

    it('should designate ALL financial requirements as release blockers', () => {
      const mappings = service.getAllMappings();
      const financialReqs = mappings.filter((m) => m.type === RequirementType.FINANCIAL);

      expect(financialReqs.length).toBeGreaterThan(0);
      for (const req of financialReqs) {
        expect(req.isReleaseBlocker).toBe(true);
      }
    });

    it('should designate ALL P0 critical requirements as release blockers', () => {
      const mappings = service.getAllMappings();
      const p0Reqs = mappings.filter((m) => m.priority === RequirementPriority.P0);

      expect(p0Reqs.length).toBe(10);
      for (const req of p0Reqs) {
        expect(req.isReleaseBlocker).toBe(true);
      }
    });
  });

  describe('P0 Measurable Criteria & Human Acceptance Owners', () => {
    it('should ensure every P0 flow has a measurable verification threshold', () => {
      const p0Blockers = service.getP0Blockers();

      for (const req of p0Blockers) {
        expect(req.measurableCriteria).toBeDefined();
        expect(req.measurableCriteria.length).toBeGreaterThanOrEqual(15);
        expect(req.applicableCategories.length).toBeGreaterThanOrEqual(1);
        expect(req.testImplementationReference.length).toBeGreaterThan(5);
      }
    });

    it('should ensure every P0 flow has a clearly recorded human acceptance owner', () => {
      const p0Blockers = service.getP0Blockers();

      for (const req of p0Blockers) {
        expect(req.humanOwner).toBeDefined();
        expect(req.humanOwner.name.length).toBeGreaterThan(2);
        expect(req.humanOwner.role.length).toBeGreaterThan(5);
        expect(req.humanOwner.department.length).toBeGreaterThan(2);
        expect(req.humanOwner.signOffStage.length).toBeGreaterThan(5);
      }
    });

    it('should pass automated matrix coverage validation with zero gaps', () => {
      const validation = service.validateMatrixCoverage();

      expect(validation.valid).toBe(true);
      expect(validation.uncoveredP0Count).toBe(0);
      expect(validation.unassignedOwners).toEqual([]);
      expect(validation.missingBlockers).toEqual([]);
      expect(validation.releaseBlockersCount).toBe(10);
    });
  });

  describe('Filtering & Queries', () => {
    it('should filter mappings by category', () => {
      const concurrencyTests = service.getMappingsByCategory('concurrency');
      expect(concurrencyTests.length).toBeGreaterThanOrEqual(2);
      expect(
        concurrencyTests.every((m) => m.applicableCategories.includes(TestCategory.CONCURRENCY))
      ).toBe(true);

      const fieldTests = service.getMappingsByCategory('FIELD');
      expect(fieldTests.length).toBeGreaterThanOrEqual(3);
      expect(
        fieldTests.every((m) => m.applicableCategories.includes(TestCategory.FIELD))
      ).toBe(true);
    });

    it('should throw BadRequestException on invalid category', () => {
      expect(() => service.getMappingsByCategory('invalid_category')).toThrow(
        BadRequestException
      );
    });
  });

  describe('Concurrency & Immutability', () => {
    it('should handle concurrent matrix validation calls without corruption', async () => {
      const requests = Array.from({ length: 50 }, () =>
        Promise.resolve(service.validateMatrixCoverage())
      );

      const results = await Promise.all(requests);
      expect(results).toHaveLength(50);
      results.forEach((r) => {
        expect(r.valid).toBe(true);
        expect(r.uncoveredP0Count).toBe(0);
      });
    });
  });
});

