import { IsBoolean, IsArray, IsOptional } from 'class-validator';

export class UpdateWaitlistSignupConfigDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsArray()
  @IsOptional()
  steps?: any[];
}

