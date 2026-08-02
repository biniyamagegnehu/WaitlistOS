import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { CopywriterService } from './copywriter.service';
import { TestAiDto } from './dto/test-ai.dto';
import { BuildWaitlistDto } from './dto/build-waitlist.dto';
import { UpdateCopyDto } from './dto/update-copy.dto';
import { RegenerateSectionDto } from './dto/regenerate-section.dto';
import { waitlistBuilderPrompt } from './prompts/waitlist-builder.prompt';
import { InvalidJsonException } from './exceptions/ai.exceptions';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly copywriterService: CopywriterService,
  ) {}

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

    const result = await this.aiService.generateJson<{
      productName?: string;
      tagline?: string;
      description?: string;
    }>(prompt, 'WAITLIST_BUILDER', userId);

    if (!result.productName || !result.tagline) {
      throw new InvalidJsonException('AI failed to generate a complete waitlist structure. Please try again.');
    }

    return result;
  }

  // ── AI Copywriter ──────────────────────────────────────────────────

  /**
   * POST /ai/copywriter/:waitlistId/generate
   * Generate a full set of marketing copy for the waitlist.
   */
  @Post('copywriter/:waitlistId/generate')
  @UseGuards(AccessTokenGuard)
  async generateCopy(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user?.userId || user?.id || user?.sub;
    return this.copywriterService.generateCopy(waitlistId, userId);
  }

  /**
   * GET /ai/copywriter/:waitlistId
   * Retrieve the current saved copy for a waitlist.
   */
  @Get('copywriter/:waitlistId')
  @UseGuards(AccessTokenGuard)
  async getCopy(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user?.userId || user?.id || user?.sub;
    return this.copywriterService.getCopy(waitlistId, userId);
  }

  /**
   * PATCH /ai/copywriter/:waitlistId
   * Save founder edits to the copy.
   */
  @Patch('copywriter/:waitlistId')
  @UseGuards(AccessTokenGuard)
  async updateCopy(
    @Param('waitlistId') waitlistId: string,
    @Body() dto: UpdateCopyDto,
    @CurrentUser() user: any,
  ) {
    const userId = user?.userId || user?.id || user?.sub;
    return this.copywriterService.updateCopy(waitlistId, dto, userId);
  }

  /**
   * POST /ai/copywriter/:waitlistId/regenerate
   * Regenerate a single section of the copy.
   */
  @Post('copywriter/:waitlistId/regenerate')
  @UseGuards(AccessTokenGuard)
  async regenerateSection(
    @Param('waitlistId') waitlistId: string,
    @Body() dto: RegenerateSectionDto,
    @CurrentUser() user: any,
  ) {
    const userId = user?.userId || user?.id || user?.sub;
    return this.copywriterService.regenerateSection(waitlistId, dto.section, userId);
  }

  /**
   * GET /ai/copywriter/:waitlistId/versions
   * Get the version history for a waitlist's copy.
   */
  @Get('copywriter/:waitlistId/versions')
  @UseGuards(AccessTokenGuard)
  async getVersionHistory(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user?.userId || user?.id || user?.sub;
    return this.copywriterService.getVersionHistory(waitlistId, userId);
  }

  /**
   * POST /ai/copywriter/:waitlistId/versions/:versionId/restore
   * Restore a previous copy version as the current live copy.
   */
  @Post('copywriter/:waitlistId/versions/:versionId/restore')
  @UseGuards(AccessTokenGuard)
  async restoreVersion(
    @Param('waitlistId') waitlistId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user?.userId || user?.id || user?.sub;
    return this.copywriterService.restoreVersion(versionId, waitlistId, userId);
  }
}
