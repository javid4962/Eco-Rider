import { IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { SavedAddressType, SavedLocationsPaginationQuery } from '@ecoride/contracts';

export class SavedLocationsQueryDto implements SavedLocationsPaginationQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be greater than or equal to 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(50, { message: 'limit cannot exceed 50' })
  limit?: number = 10;

  @IsOptional()
  @IsIn(['PICKUP', 'DROP', 'BOTH'], {
    message: 'type must be one of: PICKUP, DROP, BOTH',
  })
  type?: SavedAddressType;
}
