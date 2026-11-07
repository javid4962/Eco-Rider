import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { InterDepotRelayService } from './inter-depot-relay.service';
import {
  CreateInterDepotRelayDto,
  RelayHandshakeVerificationDto,
  InterDepotRelayResult,
} from '@ecoride/contracts';
import { InterDepotParcelRelay } from '../../database/entities/inter-depot-parcel-relay.entity';

@Controller('inter-depot-relay')
export class InterDepotRelayController {
  constructor(private readonly relayService: InterDepotRelayService) {}

  @Post('schedule')
  async createRelay(
    @Body() dto: CreateInterDepotRelayDto,
  ): Promise<InterDepotRelayResult> {
    return await this.relayService.createRelay(dto);
  }

  @Post('handshake')
  async verifyHandshake(
    @Body() dto: RelayHandshakeVerificationDto,
  ): Promise<InterDepotRelayResult> {
    return await this.relayService.verifyHandshake(dto);
  }

  @Get(':id')
  async getRelay(@Param('id') id: string): Promise<InterDepotParcelRelay> {
    return await this.relayService.getRelay(id);
  }
}

