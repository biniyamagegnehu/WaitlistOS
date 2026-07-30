import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class BuildWaitlistDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;
}
