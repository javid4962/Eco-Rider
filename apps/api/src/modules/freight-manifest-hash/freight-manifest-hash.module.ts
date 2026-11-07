import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreightManifestHashRecordEntity } from '../../database/entities/freight-manifest-hash-record.entity';
import { FreightManifestHashService } from './freight-manifest-hash.service';
import { FreightManifestHashController } from './freight-manifest-hash.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FreightManifestHashRecordEntity])],
  controllers: [FreightManifestHashController],
  providers: [FreightManifestHashService],
  exports: [FreightManifestHashService],
})
export class FreightManifestHashModule {}

