import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { RewardType } from '@prisma/client';

export class CreateStreakMilestoneDto {
  @IsInt()
  @Min(1)
  days: number;

  @IsEnum(RewardType)
  type: RewardType;

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
