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

export interface CompanyProfile {
  companyName?: string;
  industry?: string;
  companyDescription?: string;
  country?: string;
  teamSize?: string;
  companyLogo?: string;
  companyWebsite?: string;
  onboardingCompleted?: boolean;
}

export interface CompanyProfileDto {
  companyName: string;
  industry: string;
  companyDescription: string;
  country: string;
  teamSize: string;
  companyLogo?: string;
  companyWebsite?: string;
}

export interface UpdateCompanyProfileDto {
  companyName?: string;
  industry?: string;
  companyDescription?: string;
  country?: string;
  teamSize?: string;
  companyLogo?: string;
  companyWebsite?: string;
}
