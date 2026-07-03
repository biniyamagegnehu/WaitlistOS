import { IsString, IsNotEmpty } from 'class-validator';

export class CreateWaitlistDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}
