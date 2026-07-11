import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { RewardType } from '@prisma/client';

export class UpdateRewardDto {
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

  @IsOptional()
  @IsString()
  description?: string;
}
