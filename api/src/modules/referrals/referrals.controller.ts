import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Public()
  @Get(':code')
  @HttpCode(HttpStatus.OK)
  findByCode(@Param('code') code: string) {
    return this.referralsService.findByReferralCode(code);
  }
}
