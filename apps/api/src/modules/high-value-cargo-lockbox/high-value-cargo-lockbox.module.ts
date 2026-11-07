import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HighValueLockbox } from '../../database/entities/high-value-lockbox.entity';
import { HighValueCargoLockboxService } from './high-value-cargo-lockbox.service';
import { HighValueCargoLockboxController } from './high-value-cargo-lockbox.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HighValueLockbox])],
  controllers: [HighValueCargoLockboxController],
  providers: [HighValueCargoLockboxService],
  exports: [HighValueCargoLockboxService],
})
export class HighValueCargoLockboxModule {}

