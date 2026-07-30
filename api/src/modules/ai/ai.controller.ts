import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { TestAiDto } from './dto/test-ai.dto';
import { BuildWaitlistDto } from './dto/build-waitlist.dto';
import { waitlistBuilderPrompt } from './prompts/waitlist-builder.prompt';
import { InvalidJsonException } from './exceptions/ai.exceptions';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health')
  @Public()
  async checkHealth() {
    return this.aiService.checkHealth();
  }

  @Post('test')
  @UseGuards(AccessTokenGuard)
  async testAi(@Body() testAiDto: TestAiDto, @CurrentUser() user: any) {
    const userId = user?.userId || user?.id || user?.sub;
    const result = await this.aiService.generate(testAiDto.prompt, 'test-endpoint', userId);
    return { result };
  }

  @Post('build-waitlist')
  @UseGuards(AccessTokenGuard)
  async buildWaitlist(@Body() dto: BuildWaitlistDto, @CurrentUser() user: any) {
    const userId = user?.userId || user?.id || user?.sub;
    const prompt = waitlistBuilderPrompt(dto.description);
    
    // Using the generic JSON generator and specifying the feature for logging
    const result = await this.aiService.generateJson<{
      productName?: string;
      tagline?: string;
      description?: string;
    }>(prompt, 'WAITLIST_BUILDER', userId);

    // Validate the JSON structure
    if (!result.productName || !result.tagline) {
      throw new InvalidJsonException('AI failed to generate a complete waitlist structure. Please try again.');
    }

    return result;
  }
}
