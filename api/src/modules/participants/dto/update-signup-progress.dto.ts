import { IsOptional, IsObject, IsBoolean, IsString } from 'class-validator';

export class UpdateSignupProgressDto {
  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  completeStep?: boolean;

  @IsString()
  @IsOptional()
  sessionId?: string;
}
