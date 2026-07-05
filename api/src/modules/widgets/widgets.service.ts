import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface WidgetMetadata {
  scriptUrl: string;
  embedCode: string;
  hostedPage: string;
}

@Injectable()
export class WidgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  buildMetadata(slug: string): WidgetMetadata {
    const frontendUrl = this.configService.get<string>(
      'app.frontendUrl',
      'http://localhost:3001',
    );
    const scriptUrl = `${frontendUrl}/widget.js`;
    const hostedPage = `${frontendUrl}/w/${slug}`;
    const embedCode = `<script src="${scriptUrl}" data-waitlist="${slug}"></script>`;

    return {
      scriptUrl,
      embedCode,
      hostedPage,
    };
  }

  async createForWaitlist(waitlistId: string, slug: string) {
    const metadata = this.buildMetadata(slug);

    return this.prisma.widget.create({
      data: {
        waitlistId,
        scriptUrl: metadata.scriptUrl,
        embedCode: metadata.embedCode,
      },
    });
  }

  formatWidget(widget: { scriptUrl: string; embedCode: string } | null) {
    if (!widget) {
      return null;
    }

    return {
      scriptUrl: widget.scriptUrl,
      embedCode: widget.embedCode,
    };
  }
}
