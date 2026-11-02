import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DriverProfile,
  CaptainApplication,
  ComplianceWarning,
  Vehicle,
  Document,
} from '../../database/entities';
import { IdentityModule } from '../identity/identity.module';
import { ReleaseBoundariesModule } from '../release-boundaries/release-boundaries.module';
import { AuthModule } from '../auth/auth.module';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DriverProfile,
      CaptainApplication,
      ComplianceWarning,
      Vehicle,
      Document,
    ]),
    IdentityModule,
    ReleaseBoundariesModule,
    AuthModule,
  ],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
