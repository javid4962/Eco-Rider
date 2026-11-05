import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { EmergencyRescueService } from './emergency-rescue.service';
import { RescueRequestDto, CreateRescueRequestDto, RescueUnitDto } from '@ecoride/contracts';

@Controller('rescue')
export class EmergencyRescueController {
  constructor(private readonly rescueService: EmergencyRescueService) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  requestRescue(@Body() dto: CreateRescueRequestDto): Promise<RescueRequestDto> {
    return this.rescueService.requestRescue(dto);
  }

  @Post(':ticketNumber/complete')
  @HttpCode(HttpStatus.OK)
  completeRescue(@Param('ticketNumber') ticketNumber: string): Promise<RescueRequestDto> {
    return this.rescueService.completeRescue(ticketNumber);
  }

  @Get('units')
  @HttpCode(HttpStatus.OK)
  getActiveUnits(): Promise<RescueUnitDto[]> {
    return this.rescueService.getActiveUnits();
  }
}

