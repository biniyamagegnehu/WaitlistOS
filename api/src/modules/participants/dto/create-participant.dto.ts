import { IsString, IsEmail, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateParticipantDto {
  @IsString()
  @IsNotEmpty()
  waitlistSlug!: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  // Optional referral code passed via ?ref= query param
  @IsString()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  referralCode?: string;

  // Source attribution
  @IsString()
  @IsOptional()
  source?: string; // TrafficSource enum, but accepting string from client

  @IsString()
  @IsOptional()
  @MaxLength(100)
  medium?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  campaign?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  referrer?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  landingPath?: string;

  // Funnel analytics session ID
  @IsUUID()
  @IsOptional()
  sessionId?: string;
}
