import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateParticipantDto {
  @IsString()
  @IsNotEmpty()
  waitlistId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
