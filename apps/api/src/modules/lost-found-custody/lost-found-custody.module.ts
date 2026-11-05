import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LostFoundCustodyService } from './lost-found-custody.service';
import { LostFoundCustodyController } from './lost-found-custody.controller';
import { LostItemCustody } from '../../database/entities/lost-item-custody.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LostItemCustody])],
  controllers: [LostFoundCustodyController],
  providers: [LostFoundCustodyService],
  exports: [LostFoundCustodyService],
})
export class LostFoundCustodyModule {}
