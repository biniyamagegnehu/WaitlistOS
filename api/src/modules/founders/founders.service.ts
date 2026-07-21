import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CompanyProfileDto, UpdateCompanyProfileDto } from './dto/company-profile.dto';

@Injectable()
export class FoundersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanyProfile(userId: string) {
    const founder = await this.prisma.founder.findUnique({
      where: { userId },
    });

    if (!founder) {
      throw new NotFoundException('Founder profile not found');
    }

    return {
      companyName: founder.companyName,
      industry: founder.industry,
      companyDescription: founder.companyDescription,
      country: founder.country,
      teamSize: founder.teamSize,
      companyLogo: founder.companyLogo,
      companyWebsite: founder.companyWebsite,
      onboardingCompleted: founder.onboardingCompleted,
    };
  }

  async createCompanyProfile(userId: string, dto: CompanyProfileDto) {
    const founder = await this.prisma.founder.findUnique({
      where: { userId },
    });

    if (!founder) {
      throw new NotFoundException('Founder profile not found');
    }

    const updatedFounder = await this.prisma.founder.update({
      where: { userId },
      data: {
        companyName: dto.companyName,
        industry: dto.industry,
        companyDescription: dto.companyDescription,
        country: dto.country,
        teamSize: dto.teamSize,
        companyLogo: dto.companyLogo,
        companyWebsite: dto.companyWebsite,
        onboardingCompleted: true,
      },
    });

    return {
      companyName: updatedFounder.companyName,
      industry: updatedFounder.industry,
      companyDescription: updatedFounder.companyDescription,
      country: updatedFounder.country,
      teamSize: updatedFounder.teamSize,
      companyLogo: updatedFounder.companyLogo,
      companyWebsite: updatedFounder.companyWebsite,
      onboardingCompleted: updatedFounder.onboardingCompleted,
    };
  }

  async updateCompanyProfile(userId: string, dto: UpdateCompanyProfileDto) {
    const founder = await this.prisma.founder.findUnique({
      where: { userId },
    });

    if (!founder) {
      throw new NotFoundException('Founder profile not found');
    }

    const updatedFounder = await this.prisma.founder.update({
      where: { userId },
      data: {
        ...(dto.companyName !== undefined && { companyName: dto.companyName }),
        ...(dto.industry !== undefined && { industry: dto.industry }),
        ...(dto.companyDescription !== undefined && { companyDescription: dto.companyDescription }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.teamSize !== undefined && { teamSize: dto.teamSize }),
        ...(dto.companyLogo !== undefined && { companyLogo: dto.companyLogo }),
        ...(dto.companyWebsite !== undefined && { companyWebsite: dto.companyWebsite }),
      },
    });

    return {
      companyName: updatedFounder.companyName,
      industry: updatedFounder.industry,
      companyDescription: updatedFounder.companyDescription,
      country: updatedFounder.country,
      teamSize: updatedFounder.teamSize,
      companyLogo: updatedFounder.companyLogo,
      companyWebsite: updatedFounder.companyWebsite,
      onboardingCompleted: updatedFounder.onboardingCompleted,
    };
  }

  async checkOnboardingStatus(userId: string): Promise<boolean> {
    const founder = await this.prisma.founder.findUnique({
      where: { userId },
      select: { onboardingCompleted: true },
    });

    return founder?.onboardingCompleted ?? false;
  }
}
