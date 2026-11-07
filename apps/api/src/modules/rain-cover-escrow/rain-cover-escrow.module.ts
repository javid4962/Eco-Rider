import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RainCoverEscrowSessionEntity } from '../../database/entities/rain-cover-escrow-session.entity';
import { RainCoverEscrowService } from './rain-cover-escrow.service';
import { RainCoverEscrowController } from './rain-cover-escrow.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RainCoverEscrowSessionEntity])],
  controllers: [RainCoverEscrowController],
  providers: [RainCoverEscrowService],
  exports: [RainCoverEscrowService],
})
export class RainCoverEscrowModule {}
