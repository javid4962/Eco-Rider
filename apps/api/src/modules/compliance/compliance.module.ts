import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DriverProfile,
  CaptainApplication,
  ComplianceWarning,
  Vehicle,
  Document,
  CaptainLocationPing,
} from '../../database/entities';
import { IdentityModule } from '../identity/identity.module';
import { ReleaseBoundariesModule } from '../release-boundaries/release-boundaries.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { ComplianceService } from './compliance.service';
import { CaptainAvailabilityService } from './captain-availability.service';
import { BatteryDispatchService } from './battery-dispatch.service';
import { ComplianceController } from './compliance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DriverProfile,
      CaptainApplication,
      ComplianceWarning,
      Vehicle,
      Document,
      CaptainLocationPing,
    ]),
    IdentityModule,
    ReleaseBoundariesModule,
    AuthModule,
    RedisModule,
  ],
  controllers: [ComplianceController],
  providers: [ComplianceService, CaptainAvailabilityService, BatteryDispatchService],
  exports: [ComplianceService, CaptainAvailabilityService, BatteryDispatchService],
})
export class ComplianceModule {}
