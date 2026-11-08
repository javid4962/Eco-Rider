import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scope3CarbonCertificateEntity } from '../../database/entities/scope3-carbon-certificate.entity';
import { Scope3CarbonOffsetService } from './scope3-carbon-offset.service';
import { Scope3CarbonOffsetController } from './scope3-carbon-offset.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Scope3CarbonCertificateEntity])],
  controllers: [Scope3CarbonOffsetController],
  providers: [Scope3CarbonOffsetService],
  exports: [Scope3CarbonOffsetService],
})
export class Scope3CarbonOffsetModule {}

