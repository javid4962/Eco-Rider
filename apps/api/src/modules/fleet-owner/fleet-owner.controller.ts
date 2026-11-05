import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { FleetOwnerService } from './fleet-owner.service';
import { FleetLeaseModel } from '@ecoride/contracts';

@Controller('fleet-owner')
export class FleetOwnerController {
  constructor(private readonly fleetOwnerService: FleetOwnerService) {}

  @Post('contracts')
  @HttpCode(HttpStatus.CREATED)
  createContract(
    @Body()
    dto: {
      fleetOwnerId: string;
      captainId: string;
      vehicleId: string;
      vehicleRegistrationNumber: string;
      leaseModel: FleetLeaseModel;
      dailyRentPaise?: number;
      ownerSharePercent?: number;
      captainSharePercent?: number;
      startDate: string;
    },
  ) {
    return this.fleetOwnerService.createContract(dto);
  }

  @Get(':ownerId/contracts')
  @HttpCode(HttpStatus.OK)
  listContracts(@Param('ownerId', ParseUUIDPipe) ownerId: string) {
    return this.fleetOwnerService.listContracts(ownerId);
  }

  @Get(':ownerId/settlement')
  @HttpCode(HttpStatus.OK)
  getSettlement(
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
    @Query('date') date?: string,
  ) {
    return this.fleetOwnerService.calculateSettlementSummary(ownerId, date);
  }
}

