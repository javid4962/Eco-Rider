import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgriProduceConsignmentEntity } from '../../database/entities/agri-produce-consignment.entity';
import { RuralAgriCargoService } from './rural-agri-cargo.service';
import { RuralAgriCargoController } from './rural-agri-cargo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AgriProduceConsignmentEntity])],
  controllers: [RuralAgriCargoController],
  providers: [RuralAgriCargoService],
  exports: [RuralAgriCargoService],
})
export class RuralAgriCargoModule {}

