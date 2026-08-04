import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { RewardType } from '@prisma/client';

export class UpdateStreakMilestoneDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;

  @IsOptional()
  @IsEnum(RewardType)
  type?: RewardType;

  @IsOptional()
  @IsInt()
  value?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
