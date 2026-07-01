import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateWaitlistDto {
  @IsString()
  @IsOptional()
  founderId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}
