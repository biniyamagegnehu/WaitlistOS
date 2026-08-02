import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';
import { WaitlistsService } from '../waitlists/waitlists.service';
import { copywriterPrompt } from './prompts/copywriter.prompt';
import { UpdateCopyDto } from './dto/update-copy.dto';
import { InvalidJsonException } from './exceptions/ai.exceptions';
import type { CopySection } from './dto/regenerate-section.dto';

export interface CopyFeature {
  title: string;
  description: string;
}

export interface CopyFaq {
  question: string;
  answer: string;
}

export interface GeneratedCopy {
  headline: string;
  subheadline: string;
  cta: string;
  features: CopyFeature[];
  faqs: CopyFaq[];
}

@Injectable()
export class CopywriterService {
  private readonly logger = new Logger(CopywriterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly waitlistsService: WaitlistsService,
  ) {}

  /**
   * Generates a full set of copy for the waitlist and persists it.
   * Creates a version snapshot every time.
   */
  async generateCopy(waitlistId: string, userId: string) {
    const waitlist = await this.waitlistsService.findOwnedWaitlistOrThrow(waitlistId, userId);

    const prompt = copywriterPrompt({
      productName: waitlist.name,
      tagline: waitlist.tagline,
      description: waitlist.description,
    });

    const generated = await this.aiService.generateJson<GeneratedCopy>(
      prompt,
      'AI_COPYWRITER',
      userId,
    );

    this.validateGeneratedCopy(generated);

    return this.upsertCopy(waitlistId, generated);
  }

  /**
   * Returns the current copy for a waitlist, or null if none exists.
   */
  async getCopy(waitlistId: string, userId: string) {
    await this.waitlistsService.findOwnedWaitlistOrThrow(waitlistId, userId);

    return this.prisma.waitlistCopy.findUnique({
      where: { waitlistId },
    });
  }

  /**
   * Saves founder edits and creates a version snapshot.
   */
  async updateCopy(waitlistId: string, dto: UpdateCopyDto, userId: string) {
    await this.waitlistsService.findOwnedWaitlistOrThrow(waitlistId, userId);

    const existing = await this.prisma.waitlistCopy.findUnique({
      where: { waitlistId },
    });

    if (!existing) {
      throw new NotFoundException('No copy found for this waitlist. Generate it first.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Snapshot the current state before overwriting
      await tx.waitlistCopyVersion.create({
        data: {
          copyId: existing.id,
          headline: existing.headline,
          subheadline: existing.subheadline,
          cta: existing.cta,
          features: existing.features as any,
          faqs: existing.faqs as any,
        },
      });

      return tx.waitlistCopy.update({
        where: { waitlistId },
        data: {
          headline: dto.headline ?? existing.headline,
          subheadline: dto.subheadline ?? existing.subheadline,
          cta: dto.cta ?? existing.cta,
          features: dto.features ? (dto.features as any) : (existing.features as any),
          faqs: dto.faqs ? (dto.faqs as any) : (existing.faqs as any),
        },
      });
    });

    return updated;
  }

  /**
   * Regenerates a single section and patches the existing copy.
   */
  async regenerateSection(waitlistId: string, section: CopySection, userId: string) {
    const waitlist = await this.waitlistsService.findOwnedWaitlistOrThrow(waitlistId, userId);

    const existing = await this.prisma.waitlistCopy.findUnique({
      where: { waitlistId },
    });

    if (!existing) {
      throw new NotFoundException('No copy found for this waitlist. Generate it first.');
    }

    // Build a targeted prompt for just this section
    const sectionPrompt = this.buildSectionPrompt(section, {
      productName: waitlist.name,
      tagline: waitlist.tagline,
      description: waitlist.description,
    });

    const generated = await this.aiService.generateJson<Partial<GeneratedCopy>>(
      sectionPrompt,
      'AI_COPYWRITER',
      userId,
    );

    // Validate the specific section returned
    this.validateSection(section, generated);

    const updated = await this.prisma.$transaction(async (tx) => {
      // Snapshot before patching
      await tx.waitlistCopyVersion.create({
        data: {
          copyId: existing.id,
          headline: existing.headline,
          subheadline: existing.subheadline,
          cta: existing.cta,
          features: existing.features as any,
          faqs: existing.faqs as any,
        },
      });

      const patchData: Record<string, any> = {};
      if (section === 'features' || section === 'faqs') {
        patchData[section] = generated[section] as any;
      } else {
        patchData[section] = generated[section] as string;
      }

      return tx.waitlistCopy.update({
        where: { waitlistId },
        data: patchData,
      });
    });

    return updated;
  }

  /**
   * Returns all version snapshots for a waitlist's copy, newest first.
   */
  async getVersionHistory(waitlistId: string, userId: string) {
    await this.waitlistsService.findOwnedWaitlistOrThrow(waitlistId, userId);

    const copy = await this.prisma.waitlistCopy.findUnique({
      where: { waitlistId },
    });

    if (!copy) {
      return [];
    }

    return this.prisma.waitlistCopyVersion.findMany({
      where: { copyId: copy.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Restores a previous version as the current live copy (creates a new snapshot).
   */
  async restoreVersion(versionId: string, waitlistId: string, userId: string) {
    await this.waitlistsService.findOwnedWaitlistOrThrow(waitlistId, userId);

    const version = await this.prisma.waitlistCopyVersion.findUnique({
      where: { id: versionId },
      include: { copy: true },
    });

    if (!version || version.copy.waitlistId !== waitlistId) {
      throw new NotFoundException('Version not found for this waitlist.');
    }

    const { copy } = version;

    return this.prisma.$transaction(async (tx) => {
      // Snapshot the current state before restoring
      await tx.waitlistCopyVersion.create({
        data: {
          copyId: copy.id,
          headline: copy.headline,
          subheadline: copy.subheadline,
          cta: copy.cta,
          features: copy.features as any,
          faqs: copy.faqs as any,
        },
      });

      return tx.waitlistCopy.update({
        where: { waitlistId },
        data: {
          headline: version.headline,
          subheadline: version.subheadline,
          cta: version.cta,
          features: version.features as any,
          faqs: version.faqs as any,
        },
      });
    });
  }

  // ── Private Helpers ──────────────────────────────────────────────────

  private async upsertCopy(waitlistId: string, data: GeneratedCopy) {
    const existing = await this.prisma.waitlistCopy.findUnique({
      where: { waitlistId },
    });

    return this.prisma.$transaction(async (tx) => {
      if (existing) {
        // Snapshot the old copy before overwriting
        await tx.waitlistCopyVersion.create({
          data: {
            copyId: existing.id,
            headline: existing.headline,
            subheadline: existing.subheadline,
            cta: existing.cta,
            features: existing.features as any,
            faqs: existing.faqs as any,
          },
        });

        return tx.waitlistCopy.update({
          where: { waitlistId },
          data: {
            headline: data.headline,
            subheadline: data.subheadline,
            cta: data.cta,
            features: data.features as any,
            faqs: data.faqs as any,
            generatedAt: new Date(),
          },
        });
      }

      return tx.waitlistCopy.create({
        data: {
          waitlistId,
          headline: data.headline,
          subheadline: data.subheadline,
          cta: data.cta,
          features: data.features as any,
          faqs: data.faqs as any,
        },
      });
    });
  }

  private validateGeneratedCopy(copy: GeneratedCopy): void {
    const errors: string[] = [];

    if (!copy.headline || typeof copy.headline !== 'string') errors.push('headline');
    if (!copy.subheadline || typeof copy.subheadline !== 'string') errors.push('subheadline');
    if (!copy.cta || typeof copy.cta !== 'string') errors.push('cta');
    if (!Array.isArray(copy.features) || copy.features.length !== 3) errors.push('features (must be array of 3)');
    if (!Array.isArray(copy.faqs) || copy.faqs.length !== 5) errors.push('faqs (must be array of 5)');

    if (errors.length > 0) {
      this.logger.error(`AI copywriter returned invalid structure. Missing/invalid: ${errors.join(', ')}`);
      throw new InvalidJsonException(
        'AI returned an incomplete copy structure. Please try again.',
      );
    }
  }

  private validateSection(section: CopySection, result: Partial<GeneratedCopy>): void {
    if (section === 'features') {
      if (!Array.isArray(result.features) || result.features.length !== 3) {
        throw new InvalidJsonException('AI returned invalid features. Please try again.');
      }
    } else if (section === 'faqs') {
      if (!Array.isArray(result.faqs) || result.faqs.length !== 5) {
        throw new InvalidJsonException('AI returned invalid FAQs. Please try again.');
      }
    } else {
      if (!result[section] || typeof result[section] !== 'string') {
        throw new InvalidJsonException(`AI returned invalid ${section}. Please try again.`);
      }
    }
  }

  private buildSectionPrompt(
    section: CopySection,
    ctx: { productName: string; tagline: string; description?: string | null },
  ): string {
    const base = `
You are an expert SaaS conversion copywriter. Generate ONLY the requested section of marketing copy for the product below.

Product Name: ${ctx.productName}
Tagline: ${ctx.tagline}
Description: ${ctx.description ?? 'Not provided — infer from product name and tagline.'}

Return ONLY valid JSON with no markdown or extra text.
`;

    const sectionInstructions: Record<CopySection, string> = {
      headline: `${base}
Return: { "headline": "Short punchy headline (max 10 words)" }`,

      subheadline: `${base}
Return: { "subheadline": "Supporting sentence expanding on value proposition (max 20 words)" }`,

      cta: `${base}
Return: { "cta": "CTA button text (max 5 words, imperative verb)" }`,

      features: `${base}
Return exactly 3 feature highlights:
{ "features": [
  { "title": "Feature title (3-4 words)", "description": "One sentence benefit" },
  { "title": "Feature title (3-4 words)", "description": "One sentence benefit" },
  { "title": "Feature title (3-4 words)", "description": "One sentence benefit" }
] }`,

      faqs: `${base}
Return exactly 5 FAQs:
{ "faqs": [
  { "question": "Question?", "answer": "Answer (1-2 sentences)" },
  { "question": "Question?", "answer": "Answer (1-2 sentences)" },
  { "question": "Question?", "answer": "Answer (1-2 sentences)" },
  { "question": "Question?", "answer": "Answer (1-2 sentences)" },
  { "question": "Question?", "answer": "Answer (1-2 sentences)" }
] }`,
    };

    return sectionInstructions[section];
  }
}
