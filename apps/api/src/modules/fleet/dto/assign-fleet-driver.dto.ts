import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignFleetDriverRequest } from '@ecoride/contracts';

export class AssignFleetDriverDto implements AssignFleetDriverRequest {
  @ApiProperty({
    description: 'Target Captain User UUID to assign to this fleet EV',
    example: 'c1000000-0000-4000-8000-000000000001',
  })
  @IsNotEmpty()
  @IsUUID()
  driverUserId!: string;

  @ApiPropertyOptional({
    description: 'Operational reason for assignment or reassignment',
    example: 'SHIFT_ROTATION',
    default: 'INITIAL_ASSIGNMENT',
  })
  @IsOptional()
  @IsString()
  assignmentReason?: string;

  @ApiPropertyOptional({
    description: 'Internal fleet dispatch notes or assignment terms',
    example: 'Assigned for Vizag Port corridor morning shift roster',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

