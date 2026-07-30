import { IsNotEmpty, IsString } from 'class-validator';

export class TestAiDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
