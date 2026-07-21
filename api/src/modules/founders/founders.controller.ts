import { Controller, Get, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { FoundersService } from './founders.service';
import { CompanyProfileDto, UpdateCompanyProfileDto } from './dto/company-profile.dto';

@Controller('founders')
@UseGuards(AccessTokenGuard)
export class FoundersController {
  constructor(private readonly foundersService: FoundersService) {}

  @Get('company-profile')
  async getCompanyProfile(@Request() req) {
    return this.foundersService.getCompanyProfile(req.user.userId);
  }

  @Post('company-profile')
  async createCompanyProfile(@Request() req, @Body() dto: CompanyProfileDto) {
    return this.foundersService.createCompanyProfile(req.user.userId, dto);
  }

  @Put('company-profile')
  async updateCompanyProfile(@Request() req, @Body() dto: UpdateCompanyProfileDto) {
    return this.foundersService.updateCompanyProfile(req.user.userId, dto);
  }

  @Get('onboarding-status')
  async getOnboardingStatus(@Request() req) {
    const completed = await this.foundersService.checkOnboardingStatus(req.user.userId);
    return { onboardingCompleted: completed };
  }
}
