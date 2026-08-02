import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export type CopySection = 'headline' | 'subheadline' | 'cta' | 'features' | 'faqs';

export class RegenerateSectionDto {
  @IsEnum(['headline', 'subheadline', 'cta', 'features', 'faqs'])
  section: CopySection;
}
