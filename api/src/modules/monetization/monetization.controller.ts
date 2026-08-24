import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, Req, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { MonetizationService } from './monetization.service';
import { ConnectChapaDto, CreateCheckoutDto, UpdatePreOrderDepositConfigDto } from './dto/monetization.dtos';
import { PaymentProvider } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { Public } from '../../common/decorators/public.decorator';
import type { Response, Request } from 'express';

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

  // ── Skip the Line Checkout ──────────────────────────────────────────────────

  /**
   * POST /api/monetization/skip-line/checkout
   *
   * Creates a Skip the Line checkout session for a participant.
   * The participant must be authenticated and the waitlist must have Skip the Line enabled.
   */
  @UseGuards(AccessTokenGuard)
  /**
   * POST /api/monetization/skip-line/checkout
   *
   * Creates a Skip the Line checkout session.
   * This endpoint is public (no auth) but requires waitlistId and participantId.
   * It auto-selects the active payment provider for the waitlist.
   */
  @Public()
  @Post('skip-line/checkout')
  async createSkipLineCheckout(@Body() dto: CreateCheckoutDto) {
    return this.monetizationService.createSkipLineCheckoutPublic(dto);
  }

  /**
   * GET /api/monetization/skip-line/status/:paymentId
   *
   * Retrieves the status of a Skip the Line payment (public endpoint).
   */
  @Public()
  @Get('skip-line/status/:paymentId')
  async getSkipLineStatusPublic(@Param('paymentId') paymentId: string) {
    return this.monetizationService.getSkipLinePaymentStatusPublic(paymentId);
  }

  /**
   * GET /api/monetization/skip-line/status/:paymentId
   *
   * Retrieves the status of a Skip the Line payment (protected endpoint).
   */
  @UseGuards(AccessTokenGuard)
  @Get('skip-line/status/protected/:paymentId')
  async getSkipLineStatus(@Req() req: any, @Param('paymentId') paymentId: string) {
    return this.monetizationService.getSkipLinePaymentStatus(paymentId, req.user.userId);
  }

  /**
   * GET /api/monetization/skip-line/status/latest
   *
   * Retrieves the latest Skip the Line payment for the current user (protected).
   */
  @UseGuards(AccessTokenGuard)
  @Get('skip-line/status/latest')
  async getLatestSkipLineStatus(@Req() req: any) {
    return this.monetizationService.getLatestSkipLinePaymentStatus(req.user.userId);
  }

  /**
   * GET /api/monetization/skip-line/status/public/latest
   *
   * Retrieves the latest Skip the Line payment by participant ID (public endpoint).
   */
  @Public()
  @Get('skip-line/status/public/latest')
  async getLatestSkipLineStatusPublic(@Query('participantId') participantId: string, @Query('waitlistId') waitlistId: string) {
    return this.monetizationService.getLatestSkipLinePaymentStatusPublic(participantId, waitlistId);
  }

  /**
   * POST /api/monetization/skip-line/verify/:paymentId
   *
   * Manually verify a Chapa payment (for testing/fallback when webhooks fail).
   * This endpoint is public for testing purposes.
   */
  @Public()
  @Post('skip-line/verify/:paymentId')
  async verifyChapaPayment(@Param('paymentId') paymentId: string) {
    return this.monetizationService.verifyChapaPayment(paymentId);
  }

  /**
   * POST /api/monetization/webhooks/stripe
   *
   * Receives Stripe event webhooks. This route is public — Stripe servers
   * do not send a JWT. Signature verification is performed inside the service.
   */
  @Public()
  @Post('webhooks/stripe')
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    if (!signature) throw new BadRequestException('Missing stripe-signature header');

    // NestFactory is bootstrapped with rawBody: true, so req.rawBody is available.
    const rawBody = (req as any).rawBody?.toString('utf8') ?? JSON.stringify(req.body);

    return this.monetizationService.handleWebhook(PaymentProvider.STRIPE, rawBody, signature);
  }

  /**
   * POST /api/monetization/webhooks/chapa
   *
   * Receives Chapa event webhooks. This route is public — Chapa servers
   * do not send a JWT. Signature verification is performed inside the service.
   */
  @Public()
  @Post('webhooks/chapa')
  async handleChapaWebhook(
    @Req() req: Request,
    @Headers('chapa-signature') signature: string | undefined,
  ) {
    if (!signature) throw new BadRequestException('Missing chapa-signature header');

    const rawBody = (req as any).rawBody?.toString('utf8') ?? JSON.stringify(req.body);
    return this.monetizationService.handleWebhook(PaymentProvider.CHAPA, rawBody, signature);
  }

  /**
   * GET /api/monetization/payments
   *
   * Retrieves monetization payments with optional filters.
   */
  @UseGuards(AccessTokenGuard)
  @Get('payments')
  async getPayments(@Req() req: any, @Query() query: any) {
    return this.monetizationService.getPayments(req.user.userId, query);
  }

  /**
   * GET /api/monetization/skip-line/analytics/:waitlistId
   *
   * Retrieves Skip the Line analytics for a specific waitlist.
   */
  @UseGuards(AccessTokenGuard)
  @Get('skip-line/analytics/:waitlistId')
  async getSkipLineAnalytics(@Req() req: any, @Param('waitlistId') waitlistId: string, @Query() filters: any) {
    return this.monetizationService.getSkipLineAnalytics(req.user.userId, waitlistId, filters);
  }

  /**
   * GET /api/monetization/payments/:paymentId
   *
   * Retrieves detailed information about a specific payment.
   */
  @UseGuards(AccessTokenGuard)
  @Get('payments/:paymentId')
  async getPaymentDetails(@Req() req: any, @Param('paymentId') paymentId: string) {
    return this.monetizationService.getPaymentDetails(req.user.userId, paymentId);
  }

  /**
   * PATCH /api/monetization/skip-line/config/:waitlistId
   *
   * Updates Skip the Line configuration for a waitlist.
   */
  @UseGuards(AccessTokenGuard)
  @Patch('skip-line/config/:waitlistId')
  async updateSkipLineConfig(@Req() req: any, @Param('waitlistId') waitlistId: string, @Body() config: any) {
    return this.monetizationService.updateSkipLineConfig(req.user.userId, waitlistId, config);
  }

  // ── Pre-Order Deposit ───────────────────────────────────────────────────────

  @UseGuards(AccessTokenGuard)
  @Get('pre-order/config/:waitlistId')
  async getPreOrderConfig(@Req() req: any, @Param('waitlistId') waitlistId: string) {
    return this.monetizationService.getPreOrderConfig(req.user.userId, waitlistId);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('pre-order/config/:waitlistId')
  async updatePreOrderConfig(@Req() req: any, @Param('waitlistId') waitlistId: string, @Body() config: UpdatePreOrderDepositConfigDto) {
    return this.monetizationService.updatePreOrderConfig(req.user.userId, waitlistId, config);
  }

  @Public()
  @Post('pre-order/checkout')
  async createPreOrderCheckout(@Body() dto: CreateCheckoutDto) {
    return this.monetizationService.createPreOrderCheckoutPublic(dto);
  }

  @Public()
  @Get('pre-order/status/:depositId')
  async getPreOrderStatusPublic(@Param('depositId') depositId: string) {
    return this.monetizationService.getPreOrderStatusPublic(depositId);
  }

  @Public()
  @Get('pre-order/status/public/latest')
  async getPreOrderLatestPublic(@Query('participantId') participantId: string, @Query('waitlistId') waitlistId: string) {
    return this.monetizationService.getPreOrderLatestPublic(participantId, waitlistId);
  }

  @Public()
  @Post('pre-order/verify/:paymentId')
  async verifyPreOrderPayment(@Param('paymentId') paymentId: string) {
    return this.monetizationService.verifyPreOrderPayment(paymentId);
  }

  @UseGuards(AccessTokenGuard)
  @Get('pre-order/deposits/:waitlistId')
  async getPreOrderDeposits(@Req() req: any, @Param('waitlistId') waitlistId: string, @Query() query: any) {
    return this.monetizationService.getPreOrderDeposits(req.user.userId, waitlistId, query);
  }

  @UseGuards(AccessTokenGuard)
  @Get('pre-order/analytics/:waitlistId')
  async getPreOrderAnalytics(@Req() req: any, @Param('waitlistId') waitlistId: string, @Query() filters: any) {
    return this.monetizationService.getPreOrderAnalytics(req.user.userId, waitlistId, filters);
  }

}
