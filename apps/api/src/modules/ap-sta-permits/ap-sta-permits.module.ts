import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalPermitRecord } from '../../database/entities/digital-permit-record.entity';
import { ApStaPermitsService } from './ap-sta-permits.service';
import { ApStaPermitsController } from './ap-sta-permits.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DigitalPermitRecord])],
  controllers: [ApStaPermitsController],
  providers: [ApStaPermitsService],
  exports: [ApStaPermitsService],
})
export class ApStaPermitsModule {}

