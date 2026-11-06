import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SmartLockersService } from './smart-lockers.service';
import {
  DepositParcelDto,
  RetrieveParcelDto,
  LockerOperationResultDto,
} from '@ecoride/contracts';

@Controller('smart-lockers')
export class SmartLockersController {
  constructor(private readonly lockersService: SmartLockersService) {}

  @Post('parcels/deposit')
  @HttpCode(HttpStatus.OK)
  depositParcel(@Body() dto: DepositParcelDto): Promise<LockerOperationResultDto> {
    return this.lockersService.depositParcel(dto);
  }

  @Post('parcels/retrieve')
  @HttpCode(HttpStatus.OK)
  retrieveParcel(@Body() dto: RetrieveParcelDto): Promise<LockerOperationResultDto> {
    return this.lockersService.retrieveParcel(dto);
  }
}

