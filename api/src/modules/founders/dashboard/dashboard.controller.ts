import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ── GET /dashboard/waitlists ─────────────────────────────────────────────
  @Get('waitlists')
  getWaitlists(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getWaitlists(user.userId);
  }

  // ── GET /dashboard/waitlists/:id ─────────────────────────────────────────
  @Get('waitlists/:id')
  getWaitlistDetail(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dashboardService.getWaitlistDetail(id, user.userId);
  }

  // ── GET /dashboard/waitlists/:id/export ──────────────────────────────────
  @Get('waitlists/:id/export')
  async exportCsv(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const { csv, slug } = await this.dashboardService.exportCsv(id, user.userId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${slug}-participants.csv"`,
    );
    res.send(csv);
  }
}
