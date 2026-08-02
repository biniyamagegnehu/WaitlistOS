import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GenerateCopyDto {
  @IsUUID()
  @IsNotEmpty()
  waitlistId: string;
}
