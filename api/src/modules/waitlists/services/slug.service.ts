import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SlugService {
  constructor(private readonly prisma: PrismaService) {}

  generateBaseSlug(name: string): string {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || 'waitlist';
  }

  async generateUniqueSlug(name: string, excludeWaitlistId?: string): Promise<string> {
    const baseSlug = this.generateBaseSlug(name);
    let candidate = baseSlug;
    let counter = 2;

    while (await this.slugExists(candidate, excludeWaitlistId)) {
      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }

    return candidate;
  }

  async isSlugAvailable(
    slug: string,
    excludeWaitlistId?: string,
  ): Promise<boolean> {
    return !(await this.slugExists(slug, excludeWaitlistId));
  }

  async slugExists(slug: string, excludeWaitlistId?: string): Promise<boolean> {
    const existing = await this.prisma.waitlist.findFirst({
      where: {
        slug,
        ...(excludeWaitlistId ? { NOT: { id: excludeWaitlistId } } : {}),
      },
      select: { id: true },
    });

    return Boolean(existing);
  }
}
