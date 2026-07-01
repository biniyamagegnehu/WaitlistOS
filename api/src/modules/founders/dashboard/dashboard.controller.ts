import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ── GET /dashboard/waitlists ─────────────────────────────────────────────
  @Get('waitlists')
  getWaitlists(@Query('founderId') founderId?: string) {
    return this.dashboardService.getWaitlists(founderId);
  }

  // ── GET /dashboard/waitlists/:id ─────────────────────────────────────────
  @Get('waitlists/:id')
  getWaitlistDetail(
    @Param('id') id: string,
    @Query('founderId') founderId?: string,
  ) {
    return this.dashboardService.getWaitlistDetail(id, founderId);
  }

  // ── GET /dashboard/waitlists/:id/export ──────────────────────────────────
  @Get('waitlists/:id/export')
  async exportCsv(
    @Param('id') id: string,
    @Query('founderId') founderId: string | undefined,
    @Res() res: Response,
  ) {
    const { csv, slug } = await this.dashboardService.exportCsv(id, founderId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${slug}-participants.csv"`,
    );
    res.send(csv);
  }
}
