import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CopyFeatureDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CopyFaqDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class UpdateCopyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  headline?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subheadline?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cta?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CopyFeatureDto)
  features?: CopyFeatureDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CopyFaqDto)
  faqs?: CopyFaqDto[];
}
