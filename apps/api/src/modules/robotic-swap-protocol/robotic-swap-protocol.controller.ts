import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { RoboticSwapProtocolService } from './robotic-swap-protocol.service';
import { ExecuteRoboticSwapDto } from '@ecoride/contracts';

@Controller('robotic-swap-protocol')
export class RoboticSwapProtocolController {
  constructor(private readonly service: RoboticSwapProtocolService) {}

  @Post('execute')
  async execute(@Body() dto: ExecuteRoboticSwapDto) {
    return this.service.executeRoboticSwap(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.getSession(id);
  }
}
