import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReeferTelematicsLog } from '../../database/entities/reefer-telematics-log.entity';
import { ReeferTelematicsService } from './reefer-telematics.service';
import { ReeferTelematicsController } from './reefer-telematics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReeferTelematicsLog])],
  controllers: [ReeferTelematicsController],
  providers: [ReeferTelematicsService],
  exports: [ReeferTelematicsService],
})
export class ReeferTelematicsModule {}
