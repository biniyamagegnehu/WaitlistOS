import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { RewardType } from '@prisma/client';

export class CreateRewardDto {
  @IsInt()
  @Min(1)
  milestone: number;

  @IsEnum(RewardType)
  type: RewardType;

  @IsOptional()
  @IsInt()
  value?: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
