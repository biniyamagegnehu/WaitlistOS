import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto } from './dto/create-participant.dto';

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createParticipantDto: CreateParticipantDto) {
    return this.participantsService.create(createParticipantDto);
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
}
