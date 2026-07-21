import { IsString, IsOptional, IsEnum, IsUrl, MaxLength } from 'class-validator';

export enum Industry {
  SAAS = 'SaaS',
  AI = 'Artificial Intelligence',
  FINTECH = 'FinTech',
  HEALTHTECH = 'HealthTech',
  ECOMMERCE = 'E-commerce',
  EDUCATION = 'Education',
  DEVELOPER_TOOLS = 'Developer Tools',
  MARKETING = 'Marketing',
  OTHER = 'Other',
}

export enum TeamSize {
  SOLO = 'Solo Founder',
  SMALL = '2–5 Employees',
  MEDIUM = '6–20 Employees',
  LARGE = '21–50 Employees',
  ENTERPRISE = '50+ Employees',
}

export class CompanyProfileDto {
  @IsString()
  @MaxLength(200)
  companyName: string;

  @IsEnum(Industry)
  industry: Industry;

  @IsString()
  @MaxLength(250)
  companyDescription: string;

  @IsString()
  country: string;

  @IsEnum(TeamSize)
  teamSize: TeamSize;

  @IsOptional()
  @IsString()
  companyLogo?: string;

  @IsOptional()
  @IsUrl()
  companyWebsite?: string;
}

export class UpdateCompanyProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsEnum(Industry)
  industry?: Industry;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  companyDescription?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsEnum(TeamSize)
  teamSize?: TeamSize;

  @IsOptional()
  @IsString()
  companyLogo?: string;

  @IsOptional()
  @IsUrl()
  companyWebsite?: string;
}
