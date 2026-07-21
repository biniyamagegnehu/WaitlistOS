import { api } from '@/lib/axios';
import type { CompanyProfile, CompanyProfileDto, UpdateCompanyProfileDto } from '@/types/company-profile';

export const companyProfileService = {
  async getCompanyProfile(): Promise<CompanyProfile> {
    const response = await api.get('/founders/company-profile');
    return response.data;
  },

  async createCompanyProfile(data: CompanyProfileDto): Promise<CompanyProfile> {
    const response = await api.post('/founders/company-profile', data);
    return response.data;
  },

  async updateCompanyProfile(data: UpdateCompanyProfileDto): Promise<CompanyProfile> {
    const response = await api.put('/founders/company-profile', data);
    return response.data;
  },

  async getOnboardingStatus(): Promise<{ onboardingCompleted: boolean }> {
    const response = await api.get('/founders/onboarding-status');
    return response.data;
  },
};
