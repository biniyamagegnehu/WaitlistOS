import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class OpenGatesDto {
  @IsUUID()
  waitlistId: string;

  @IsInt()
  @IsPositive()
  batchSize: number;
}
