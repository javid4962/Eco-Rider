import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorporateGreenProfile } from '../../database/entities/corporate-green-profile.entity';
import { CorporateGreenCommuteService } from './corporate-green-commute.service';
import { CorporateGreenCommuteController } from './corporate-green-commute.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CorporateGreenProfile])],
  controllers: [CorporateGreenCommuteController],
  providers: [CorporateGreenCommuteService],
  exports: [CorporateGreenCommuteService],
})
export class CorporateGreenCommuteModule {}

