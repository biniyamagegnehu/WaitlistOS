import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { ThemeMode } from '@prisma/client';

export class UpdateWaitlistDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  logoId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsOptional()
  doubleSidedRewardsEnabled?: boolean;

  @IsOptional()
  referrerRankingBonus?: number;

  @IsOptional()
  newParticipantRankingBonus?: number;

  @IsOptional()
  streakBonusesEnabled?: boolean;

  @IsOptional()
  teamReferralsEnabled?: boolean;

  @IsOptional()
  maxTeamSize?: number;

  @IsOptional()
  urgencyEnabled?: boolean;

  @IsOptional()
  batchEnabled?: boolean;

  @IsOptional()
  @IsString()
  batchName?: string;

  @IsOptional()
  batchSize?: number;

  @IsOptional()
  @IsString()
  batchDescription?: string;

  @IsOptional()
  countdownEnabled?: boolean;

  @IsOptional()
  @IsString() // Will be transformed to Date later if needed, but ISO string works
  launchDate?: Date | string;

  @IsOptional()
  showRemainingSpots?: boolean;

  @IsOptional()
  showBatchProgress?: boolean;

  @IsOptional()
  showCountdown?: boolean;

  @IsOptional()
  @IsEnum(ThemeMode)
  themeMode?: ThemeMode;

  // ── Skip the Line Configuration ─────────────────
  @IsOptional()
  skipLineEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  skipLinePrice?: number;

  @IsOptional()
  @IsString()
  skipLineCurrency?: string;
}
