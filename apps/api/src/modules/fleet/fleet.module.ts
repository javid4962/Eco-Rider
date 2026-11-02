import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FleetOrganization,
  FleetVehicleAssignment,
  FleetShift,
  Vehicle,
  DriverProfile,
  User,
  LedgerEntry,
} from '../../database/entities';
import { IdentityModule } from '../identity/identity.module';
import { AuthModule } from '../auth/auth.module';
import { FleetService } from './fleet.service';
import { FleetController } from './fleet.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FleetOrganization,
      FleetVehicleAssignment,
      FleetShift,
      Vehicle,
      DriverProfile,
      User,
      LedgerEntry,
    ]),
    IdentityModule,
    AuthModule,
  ],
  controllers: [FleetController],
  providers: [FleetService],
  exports: [FleetService],
})
export class FleetModule {}
