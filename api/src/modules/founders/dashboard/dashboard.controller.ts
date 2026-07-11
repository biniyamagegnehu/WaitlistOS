import { Controller, Get, Param, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ── GET /dashboard/overview ──────────────────────────────────────────────
  @Get('overview')
  getOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getOverview(user.userId);
  }

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
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'position' | 'referralCount' | 'createdAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('status') status?: 'WAITING' | 'INVITED' | 'ACCESSED',
  ) {
    return this.dashboardService.getWaitlistDetail(id, user.userId, {
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      search,
      sortBy,
      sortOrder,
      status,
    });
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
