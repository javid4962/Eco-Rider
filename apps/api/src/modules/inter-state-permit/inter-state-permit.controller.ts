import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { InterStatePermitService } from './inter-state-permit.service';
import { ValidateInterStatePermitDto } from '@ecoride/contracts';

@Controller('inter-state-permit')
export class InterStatePermitController {
  constructor(private readonly service: InterStatePermitService) {}

  @Post('validate')
  async validate(@Body() dto: ValidateInterStatePermitDto) {
    return this.service.validatePermit(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getPass(id);
  }
}
