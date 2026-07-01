import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ── GET /dashboard/waitlists ─────────────────────────────────────────────
  @Get('waitlists')
  getWaitlists(@Req() req: any) {
    return this.dashboardService.getWaitlists(req.user.userId);
  }

  // ── GET /dashboard/waitlists/:id ─────────────────────────────────────────
  @Get('waitlists/:id')
  getWaitlistDetail(@Param('id') id: string, @Req() req: any) {
    return this.dashboardService.getWaitlistDetail(id, req.user.userId);
  }

  // ── GET /dashboard/waitlists/:id/export ──────────────────────────────────
  @Get('waitlists/:id/export')
  async exportCsv(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { csv, slug } = await this.dashboardService.exportCsv(id, req.user.userId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${slug}-participants.csv"`,
    );
    res.send(csv);
  }
}
