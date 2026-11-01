import { Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SeedService, SeedSummary } from './seed.service';

@ApiTags('Development & Seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Check synthetic test data seed status',
    description:
      'Returns counts of seeded synthetic users, BEVs, zones, bookings, and ledger entries.',
  })
  @ApiResponse({ status: 200, description: 'Seed status retrieved successfully' })
  async getStatus(): Promise<SeedSummary> {
    return this.seedService.getSeedStatus();
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed synthetic EV mobility data',
    description:
      'Idempotently provisions fake AP cities, PostGIS zones, 100% BEVs, drivers, riders, and service flags.',
  })
  @ApiResponse({ status: 200, description: 'Synthetic dataset seeded successfully' })
  async runSeed(): Promise<SeedSummary> {
    return this.seedService.seedAll();
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset and re-seed synthetic demo data',
    description:
      'Cleans synthetic demo records and re-provisions a fresh deterministic dataset for demos and tests.',
  })
  @ApiResponse({ status: 200, description: 'Synthetic demo data reset and re-seeded successfully' })
  async resetSeed(): Promise<SeedSummary> {
    return this.seedService.resetSeed();
  }
}
