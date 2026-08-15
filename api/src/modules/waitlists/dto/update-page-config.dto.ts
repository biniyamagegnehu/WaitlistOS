import { IsInt, IsNotEmpty, IsObject, Min } from 'class-validator';

export class UpdatePageConfigDto {
  @IsObject()
  @IsNotEmpty()
  config!: Record<string, unknown>;

  @IsInt()
  @Min(1)
  version!: number;
}
