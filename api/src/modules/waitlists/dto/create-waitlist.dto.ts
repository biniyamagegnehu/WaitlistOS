import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateWaitlistDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  tagline: string;

  @IsUUID()
  @IsNotEmpty()
  logoId: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
