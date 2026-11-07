import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OccPushToTalkChannelEntity } from '../../database/entities/occ-push-to-talk-channel.entity';
import {
  PttChannelBroadcastRequest,
  PttChannelRecord,
  PttPriorityLevel,
} from '@ecoride/contracts';

@Injectable()
export class OccPushToTalkService {
  constructor(
    @InjectRepository(OccPushToTalkChannelEntity)
    private readonly channelRepo: Repository<OccPushToTalkChannelEntity>,
  ) {}

  async createChannel(
    channelId: string,
    channelName: string,
    district: string,
    priority: PttPriorityLevel,
  ): Promise<PttChannelRecord> {
    if (!channelId || !channelName) {
      throw new BadRequestException('channelId and channelName are required');
    }

    let existing = await this.channelRepo.findOne({ where: { channelId } });
    if (!existing) {
      existing = this.channelRepo.create({
        channelId,
        channelName,
        district: district || 'VIJAYAWADA',
        activeListenCount: 8,
        lastBroadcastBy: 'OCC_SYSTEM',
        priority: priority || 'DISPATCH',
      });
    } else {
      existing.channelName = channelName;
      existing.district = district;
      existing.priority = priority;
    }

    const saved = await this.channelRepo.save(existing);

    return {
      id: saved.id,
      channelId: saved.channelId,
      channelName: saved.channelName,
      district: saved.district,
      activeListenCount: saved.activeListenCount,
      lastBroadcastBy: saved.lastBroadcastBy,
      priority: saved.priority as PttPriorityLevel,
      lastActiveAt: saved.lastActiveAt ? saved.lastActiveAt.toISOString() : new Date().toISOString(),
    };
  }

  async broadcastPtt(req: PttChannelBroadcastRequest): Promise<PttChannelRecord> {
    const channel = await this.channelRepo.findOne({ where: { channelId: req.channelId } });
    if (!channel) {
      throw new NotFoundException(`PTT channel ${req.channelId} not found`);
    }

    const now = new Date();
    channel.lastBroadcastBy = `${req.senderRole}:${req.senderUserId}`;
    channel.priority = req.priority;
    channel.lastActiveAt = now;

    const saved = await this.channelRepo.save(channel);

    return {
      id: saved.id,
      channelId: saved.channelId,
      channelName: saved.channelName,
      district: saved.district,
      activeListenCount: saved.activeListenCount,
      lastBroadcastBy: saved.lastBroadcastBy,
      priority: saved.priority as PttPriorityLevel,
      lastActiveAt: saved.lastActiveAt.toISOString(),
    };
  }

  async getChannel(channelId: string): Promise<PttChannelRecord> {
    const channel = await this.channelRepo.findOne({ where: { channelId } });
    if (!channel) {
      throw new NotFoundException(`PTT channel ${channelId} not found`);
    }

    return {
      id: channel.id,
      channelId: channel.channelId,
      channelName: channel.channelName,
      district: channel.district,
      activeListenCount: channel.activeListenCount,
      lastBroadcastBy: channel.lastBroadcastBy,
      priority: channel.priority as PttPriorityLevel,
      lastActiveAt: channel.lastActiveAt ? channel.lastActiveAt.toISOString() : new Date().toISOString(),
    };
  }
}
