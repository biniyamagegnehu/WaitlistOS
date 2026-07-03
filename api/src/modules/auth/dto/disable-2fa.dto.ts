import { IsNotEmpty, IsString } from 'class-validator';

export class Disable2faDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
