import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsIn } from 'class-validator';

export class MoneyAmountDto {
  @ApiProperty({
    description: 'Monetary value strictly represented as integer paise (e.g. 15000 = ₹150.00)',
    example: 15000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  amountPaise!: number;

  @ApiProperty({
    description: 'ISO-4217 Currency code, strictly INR for Andhra Pradesh mobility platform',
    example: 'INR',
    enum: ['INR'],
  })
  @IsIn(['INR'])
  currency!: 'INR';
}

