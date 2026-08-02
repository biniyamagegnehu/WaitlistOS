export interface CopyFeature {
  title: string;
  description: string;
}

export interface CopyFaq {
  question: string;
  answer: string;
}

export interface WaitlistCopy {
  id: string;
  waitlistId: string;
  headline: string;
  subheadline: string;
  cta: string;
  features: CopyFeature[];
  faqs: CopyFaq[];
  generatedAt: string;
  updatedAt: string;
}

export interface WaitlistCopyVersion {
  id: string;
  copyId: string;
  headline: string;
  subheadline: string;
  cta: string;
  features: CopyFeature[];
  faqs: CopyFaq[];
  createdAt: string;
}

export type CopySection = 'headline' | 'subheadline' | 'cta' | 'features' | 'faqs';
