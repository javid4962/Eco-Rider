import { Controller, Get, Query } from '@nestjs/common';
import {
  TestMatrixService,
  MatrixValidationResult,
} from './test-matrix.service';
import {
  TestRequirementMapping,
  TestMatrixSummary,
} from '@ecoride/contracts';

@Controller('test-matrix')
export class TestMatrixController {
  constructor(private readonly testMatrixService: TestMatrixService) {}

  @Get()
  getAllMappings(
    @Query('category') category?: string
  ): { mappings: readonly TestRequirementMapping[] | TestRequirementMapping[] } {
    if (category) {
      return {
        mappings: this.testMatrixService.getMappingsByCategory(category),
      };
    }
    return {
      mappings: this.testMatrixService.getAllMappings(),
    };
  }

  @Get('summary')
  getSummary(): { summary: TestMatrixSummary } {
    return {
      summary: this.testMatrixService.getSummary(),
    };
  }

  @Get('p0-blockers')
  getP0Blockers(): { blockers: TestRequirementMapping[] } {
    return {
      blockers: this.testMatrixService.getP0Blockers(),
    };
  }

  @Get('coverage-validation')
  validateCoverage(): MatrixValidationResult {
    return this.testMatrixService.validateMatrixCoverage();
  }
}
