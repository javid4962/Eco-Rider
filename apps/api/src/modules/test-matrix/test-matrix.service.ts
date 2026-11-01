import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  TestCategory,
  RequirementPriority,
  RequirementType,
  TestRequirementMapping,
  TestMatrixSummary,
} from '@ecoride/contracts';
import { AUTHORITATIVE_TEST_MATRIX } from './test-matrix.constants';

export interface MatrixValidationResult {
  valid: boolean;
  totalRequirements: number;
  p0Count: number;
  releaseBlockersCount: number;
  uncoveredP0Count: number;
  unassignedOwners: string[];
  missingBlockers: string[];
}

@Injectable()
export class TestMatrixService {
  private readonly logger = new Logger(TestMatrixService.name);
  private readonly matrix: readonly TestRequirementMapping[] = AUTHORITATIVE_TEST_MATRIX;

  /**
   * Returns all requirement-to-test mappings.
   */
  getAllMappings(): readonly TestRequirementMapping[] {
    return this.matrix;
  }

  /**
   * Returns only P0 release-blocking requirements.
   */
  getP0Blockers(): TestRequirementMapping[] {
    return this.matrix.filter((m) => m.priority === RequirementPriority.P0 && m.isReleaseBlocker);
  }

  /**
   * Returns mappings filtered by test category.
   */
  getMappingsByCategory(categoryRaw: string): TestRequirementMapping[] {
    const category = this.validateCategory(categoryRaw);
    return this.matrix.filter((m) => m.applicableCategories.includes(category));
  }

  /**
   * Returns executive summary of the test matrix.
   */
  getSummary(): TestMatrixSummary {
    const categoryCoverage: Record<TestCategory, number> = {
      [TestCategory.API]: 0,
      [TestCategory.MOBILE]: 0,
      [TestCategory.ADMIN]: 0,
      [TestCategory.CONCURRENCY]: 0,
      [TestCategory.SECURITY]: 0,
      [TestCategory.FIELD]: 0,
    };

    for (const mapping of this.matrix) {
      for (const cat of mapping.applicableCategories) {
        categoryCoverage[cat] = (categoryCoverage[cat] || 0) + 1;
      }
    }

    const uniqueOwners = new Set(this.matrix.map((m) => m.humanOwner.name));

    return {
      totalRequirements: this.matrix.length,
      p0Count: this.matrix.filter((m) => m.priority === RequirementPriority.P0).length,
      p1Count: this.matrix.filter((m) => m.priority === RequirementPriority.P1).length,
      releaseBlockersCount: this.matrix.filter((m) => m.isReleaseBlocker).length,
      complianceCount: this.matrix.filter((m) => m.type === RequirementType.COMPLIANCE).length,
      financialCount: this.matrix.filter((m) => m.type === RequirementType.FINANCIAL).length,
      categoryCoverage,
      humanOwnersCount: uniqueOwners.size,
    };
  }

  /**
   * Validates test matrix coverage:
   * 1. Every P0 flow must have measurable test criteria and at least one test category.
   * 2. Every Compliance and Financial requirement must be marked as isReleaseBlocker = true.
   * 3. Every P0 flow must have an assigned, recorded human acceptance owner.
   */
  validateMatrixCoverage(): MatrixValidationResult {
    const missingBlockers: string[] = [];
    const unassignedOwners: string[] = [];
    let uncoveredP0Count = 0;

    for (const mapping of this.matrix) {
      // Rule: Compliance and Financial tests MUST be release blockers
      if (
        (mapping.type === RequirementType.COMPLIANCE ||
          mapping.type === RequirementType.FINANCIAL) &&
        !mapping.isReleaseBlocker
      ) {
        missingBlockers.push(`${mapping.reqId} (${mapping.type})`);
      }

      // Rule: Every P0 flow must have measurable test criteria
      if (mapping.priority === RequirementPriority.P0) {
        if (
          !mapping.measurableCriteria ||
          mapping.measurableCriteria.trim().length < 10 ||
          mapping.applicableCategories.length === 0
        ) {
          uncoveredP0Count++;
        }

        // Rule: Every P0 flow must have a clearly recorded human acceptance owner
        if (
          !mapping.humanOwner ||
          !mapping.humanOwner.name ||
          !mapping.humanOwner.role ||
          !mapping.humanOwner.signOffStage
        ) {
          unassignedOwners.push(mapping.reqId);
        }
      }
    }

    const valid =
      missingBlockers.length === 0 && unassignedOwners.length === 0 && uncoveredP0Count === 0;

    if (!valid) {
      this.logger.warn(
        `Test matrix validation failed: missingBlockers: ${missingBlockers.length}, unassignedOwners: ${unassignedOwners.length}, uncoveredP0: ${uncoveredP0Count}`,
      );
    }

    return {
      valid,
      totalRequirements: this.matrix.length,
      p0Count: this.matrix.filter((m) => m.priority === RequirementPriority.P0).length,
      releaseBlockersCount: this.matrix.filter((m) => m.isReleaseBlocker).length,
      uncoveredP0Count,
      unassignedOwners,
      missingBlockers,
    };
  }

  private validateCategory(categoryRaw: string): TestCategory {
    if (!categoryRaw) {
      throw new BadRequestException('Category parameter is required.');
    }
    const normalized = categoryRaw.trim().toLowerCase();
    const validCategories = Object.values(TestCategory) as string[];
    if (!validCategories.includes(normalized)) {
      throw new BadRequestException(
        `Invalid category '${categoryRaw}'. Valid test categories: ${validCategories.join(', ')}.`,
      );
    }
    return normalized as TestCategory;
  }
}
