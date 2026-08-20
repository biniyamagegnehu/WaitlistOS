import { Body, Controller, Delete, Get, Param, Post, Req, Res } from '@nestjs/common';
import { MonetizationService } from './monetization.service';
import { ConnectChapaDto } from './dto/monetization.dtos';
import { PaymentProvider } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@Controller('monetization')
export class MonetizationController {
  constructor(
    private readonly monetizationService: MonetizationService,
    private readonly configService: ConfigService,
  ) {}

  private get frontendUrl(): string {
    return this.configService.get<string>('app.frontendUrl') ?? 'http://localhost:3001';
  }

  // ── Payment Accounts ──────────────────────────────────────────────────────

  @Get('accounts')
  async getAccounts(@Req() req: any) {
    // req.user.userId is set by the JWT strategy (founderId is NOT on req.user)
    return this.monetizationService.getPaymentAccounts(req.user.userId);
  }

  // ── Stripe Connect ────────────────────────────────────────────────────────

  /**
   * POST /api/monetization/accounts/stripe/connect
   *
   * Creates or reuses a Stripe Express connected account and returns
   * an Account Link URL. The frontend must redirect the user to this URL.
   *
   * Response: { url: string }
   */
  @Post('accounts/stripe/connect')
  async connectStripe(@Req() req: any) {
    return this.monetizationService.connectStripe(req.user.userId, this.frontendUrl);
  }

  /**
   * GET /api/monetization/accounts/stripe/return
   *
   * Called when Stripe redirects the founder back after onboarding.
   * Checks the actual Stripe account status and updates the DB.
   * Redirects the user to the payments settings page.
   */
  @Get('accounts/stripe/return')
  async stripeReturn(@Req() req: any, @Res() res: Response) {
    try {
      const { status } = await this.monetizationService.handleStripeReturn(req.user.userId);
      const redirectUrl = `${this.frontendUrl}/dashboard/settings?tab=payments&stripe=${status.toLowerCase()}`;
      return res.redirect(redirectUrl);
    } catch (error) {
      const redirectUrl = `${this.frontendUrl}/dashboard/settings?tab=payments&stripe=error`;
      return res.redirect(redirectUrl);
    }
  }

  /**
   * GET /api/monetization/accounts/stripe/refresh
   *
   * Called when the Stripe Account Link has expired.
   * Generates a fresh Account Link and redirects the user to Stripe.
   */
  @Get('accounts/stripe/refresh')
  async stripeRefresh(@Req() req: any, @Res() res: Response) {
    try {
      const { url } = await this.monetizationService.refreshStripeAccountLink(
        req.user.userId,
        this.frontendUrl,
      );
      return res.redirect(url);
    } catch (error) {
      const redirectUrl = `${this.frontendUrl}/dashboard/settings?tab=payments&stripe=error`;
      return res.redirect(redirectUrl);
    }
  }

  // ── Chapa Connect ─────────────────────────────────────────────────────────

  /**
   * POST /api/monetization/accounts/chapa/connect
   *
   * Creates a Chapa subaccount for the founder using their bank details.
   * The founder's bank account number and bank code are validated by Chapa.
   *
   * Body: { bankCode, accountNumber, businessName }
   * Response: { id, provider, status, connectedAt, createdAt }
   */
  @Post('accounts/chapa/connect')
  async connectChapa(@Req() req: any, @Body() dto: ConnectChapaDto) {
    return this.monetizationService.connectChapa(
      req.user.userId,
      dto.bankCode,
      dto.accountNumber,
      dto.businessName,
    );
  }

  // ── Disconnect ────────────────────────────────────────────────────────────

  @Delete('accounts/:provider')
  async disconnectAccount(@Req() req: any, @Param('provider') provider: PaymentProvider) {
    await this.monetizationService.disconnectAccount(req.user.userId, provider);
    return { success: true };
  }
}
