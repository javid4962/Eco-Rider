import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ProviderSimulationMode, SimulateFaultRequest } from '@ecoride/contracts';

export class SimulateFaultDto implements SimulateFaultRequest {
  @ApiProperty({
    description: 'Target simulation fault mode to test client resilience and zero loading trap',
    enum: ProviderSimulationMode,
    example: ProviderSimulationMode.NORMAL,
  })
  @IsEnum(ProviderSimulationMode)
  simulationMode!: ProviderSimulationMode;

  @ApiPropertyOptional({
    description: 'Artificial latency delay in milliseconds (0 to 30000ms)',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30000)
  delayMs?: number;
}

