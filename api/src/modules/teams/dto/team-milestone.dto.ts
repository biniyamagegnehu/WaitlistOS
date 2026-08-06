import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { RewardType } from '@prisma/client';

export class CreateTeamMilestoneDto {
  @IsInt()
  @Min(1)
  milestone: number;

  @IsEnum(RewardType)
  type: RewardType;

  @IsOptional()
  @IsInt()
  value?: number;

  @IsOptional()
  @IsEnum(['fixed', 'percent'])
  valueType?: 'fixed' | 'percent';

  @IsOptional()
  @IsString()
  title?: string;
}

export class UpdateTeamMilestoneDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  milestone?: number;

  @IsOptional()
  @IsEnum(RewardType)
  type?: RewardType;

  @IsOptional()
  @IsInt()
  value?: number;

  @IsOptional()
  @IsString()
  title?: string;
}
