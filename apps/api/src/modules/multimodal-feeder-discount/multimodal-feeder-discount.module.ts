import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MultimodalFeederDiscountClaimEntity } from '../../database/entities/multimodal-feeder-discount-claim.entity';
import { MultimodalFeederDiscountService } from './multimodal-feeder-discount.service';
import { MultimodalFeederDiscountController } from './multimodal-feeder-discount.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MultimodalFeederDiscountClaimEntity])],
  controllers: [MultimodalFeederDiscountController],
  providers: [MultimodalFeederDiscountService],
  exports: [MultimodalFeederDiscountService],
})
export class MultimodalFeederDiscountModule {}

