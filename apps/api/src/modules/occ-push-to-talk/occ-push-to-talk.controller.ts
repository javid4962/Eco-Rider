import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { OccPushToTalkService } from './occ-push-to-talk.service';
import { PttChannelBroadcastRequest, PttChannelRecord, PttPriorityLevel } from '@ecoride/contracts';

@Controller('v1/occ-ptt')
export class OccPushToTalkController {
  constructor(private readonly pttService: OccPushToTalkService) {}

  @Post('channels/create')
  async createChannel(
    @Body() body: { channelId: string; channelName: string; district: string; priority: PttPriorityLevel },
  ): Promise<PttChannelRecord> {
    return this.pttService.createChannel(body.channelId, body.channelName, body.district, body.priority);
  }

  @Post('channels/:channelId/broadcast')
  async broadcastPtt(
    @Param('channelId') channelId: string,
    @Body() body: PttChannelBroadcastRequest,
  ): Promise<PttChannelRecord> {
    return this.pttService.broadcastPtt({ ...body, channelId });
  }

  @Get('channels/:channelId')
  async getChannel(@Param('channelId') channelId: string): Promise<PttChannelRecord> {
    return this.pttService.getChannel(channelId);
  }
}
