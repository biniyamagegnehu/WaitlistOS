import {
  Controller,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Headers,
  Req,
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { getClientIp, getProxyCountryCode } from '../../common/utils/client-ip.util';

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createParticipantDto: CreateParticipantDto,
    @Req() request: Request,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.participantsService.create(
      createParticipantDto,
      getClientIp(request) ?? undefined,
      userAgent,
      getProxyCountryCode(request) ?? undefined,
    );
  }


  @Public()
  @Get(':id/referral-messages')
  getReferralMessages(@Param('id') id: string) {
    return this.participantsService.getReferralMessages(id);
  }

  @Public()
  @Post(':id/referral-messages/regenerate')
  @HttpCode(HttpStatus.OK)
  regenerateReferralMessages(@Param('id') id: string) {
    return this.participantsService.regenerateReferralMessages(id);
  }

  @Public()
  @Patch(':id/signup-progress')
  updateSignupProgress(
    @Param('id') id: string,
    @Body() updateSignupProgressDto: import('./dto/update-signup-progress.dto').UpdateSignupProgressDto,
  ) {
    return this.participantsService.updateSignupProgress(id, updateSignupProgressDto);
  }

  @Public()
  @Get(':id/skip-line-status')
  getSkipLineStatus(@Param('id') id: string, @Query('waitlistId') waitlistId: string) {
    return this.participantsService.getSkipLineStatus(id, waitlistId);
  }

  @Public()
  @Get(':id/pre-order-status')
  getPreOrderStatus(@Param('id') id: string, @Query('waitlistId') waitlistId: string) {
    return this.participantsService.getPreOrderStatus(id, waitlistId);
  }

  @Public()
  @Get(':id/debug-rank')
  async debugRank(@Param('id') id: string, @Query('waitlistId') waitlistId: string) {
    return this.participantsService.debugRank(waitlistId);
  }
}
