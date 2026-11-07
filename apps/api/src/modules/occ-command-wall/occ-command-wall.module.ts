import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OccPostureAudit } from '../../database/entities/occ-posture-audit.entity';
import { OccCommandWallService } from './occ-command-wall.service';
import { OccCommandWallController } from './occ-command-wall.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OccPostureAudit])],
  controllers: [OccCommandWallController],
  providers: [OccCommandWallService],
  exports: [OccCommandWallService],
})
export class OccCommandWallModule {}

