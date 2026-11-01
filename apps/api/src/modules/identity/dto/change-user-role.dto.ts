import { IsString, IsNotEmpty } from 'class-validator';

export class ChangeUserRoleDto {
  @IsNotEmpty()
  @IsString()
  newRole!: string;

  @IsNotEmpty()
  @IsString()
  reason!: string;
}
