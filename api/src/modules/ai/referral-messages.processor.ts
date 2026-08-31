import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { AiService } from './ai.service';
import { PrismaService } from '../../prisma/prisma.service';
import { generateReferralMessagesPrompt } from './prompts/referral-messages.prompt';

interface ReferralMessagePayload {
  participantId: string;
}

interface AiReferralMessages {
  twitter: string;
  linkedin: string;
  whatsapp: string;
}

@Processor('ai-tasks')
export class ReferralMessagesProcessor {
  private readonly logger = new Logger(ReferralMessagesProcessor.name);

  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('generate-referral-messages')
  async handleGenerateMessages(job: Job<ReferralMessagePayload>) {
    const { participantId } = job.data;
    this.logger.log(`Generating referral messages for participant ${participantId}`);

    try {
      const participant = await this.prisma.participant.findUnique({
        where: { id: participantId },
        include: { waitlist: true },
      });

      if (!participant) {
        this.logger.error(`Participant ${participantId} not found`);
        return;
      }

      const { waitlist } = participant;
      
      // We will generate the referral link exactly as the frontend gets it. 
      // If the APP_URL isn't easily available, we will just use a generic format, 
      // but usually waitlists use `/r/code` which gets expanded by the frontend.
      // We can use a placeholder domain and let the frontend replace it if necessary, 
      // or we can pass the origin. Actually, it's safer to use a relative link in the prompt 
      // or a generic "waitlistos.com/r/code". Let's provide a generic absolute URL.
      const referralLink = `https://waitlistos.com/r/${participant.referralCode}`;

      const prompt = generateReferralMessagesPrompt(
        waitlist.name,
        waitlist.tagline,
        waitlist.description || '',
        participant.position,
        referralLink
      );

      let generatedMessages: AiReferralMessages;
      
      try {
        generatedMessages = await this.aiService.generateJson<AiReferralMessages>(
          prompt,
          'AI_REFERRAL_MESSAGES'
        );
      } catch (aiError: any) {
        this.logger.warn(`AI model failed to generate messages for participant ${participantId}, using fallback. Error: ${aiError.message}`);
        generatedMessages = {
          twitter: `I just joined the waitlist for ${waitlist.name}! ${waitlist.tagline ? waitlist.tagline + ' ' : ''}Join me and skip the line using my invite link: ${referralLink}`,
          linkedin: `I recently came across ${waitlist.name} and decided to join their waitlist. ${waitlist.tagline ? 'They are building something interesting: ' + waitlist.tagline + '.' : ''}\n\nIf you're interested, you can use my referral link to get priority access: ${referralLink}`,
          whatsapp: `Hey! Check out ${waitlist.name} - ${waitlist.tagline || 'it looks pretty cool'}. Use my personal link to join the waitlist and we'll both move up in line: ${referralLink}`,
        };
      }

      await this.prisma.participantReferralMessage.upsert({
        where: { participantId },
        create: {
          participantId,
          twitter: generatedMessages.twitter,
          linkedin: generatedMessages.linkedin,
          whatsapp: generatedMessages.whatsapp,
        },
        update: {
          twitter: generatedMessages.twitter,
          linkedin: generatedMessages.linkedin,
          whatsapp: generatedMessages.whatsapp,
        },
      });

      this.logger.log(`Successfully generated and saved messages for participant ${participantId}`);
    } catch (error) {
      this.logger.error(`Failed to generate referral messages for participant ${participantId}`, error.stack);
      throw error;
    }
  }
}
