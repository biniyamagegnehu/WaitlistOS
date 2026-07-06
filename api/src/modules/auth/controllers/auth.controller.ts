import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { ResendVerificationDto } from '../dto/resend-verification.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { Enable2faDto } from '../dto/enable-2fa.dto';
import { Disable2faDto } from '../dto/disable-2fa.dto';
import { Verify2faDto } from '../dto/verify-2fa.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';
import { VerifiedEmailGuard } from '../guards/verified-email.guard';
import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import type { AuthenticatedUser } from '../interfaces/jwt-payload.interface';
import type { RefreshTokenRequest } from '../strategies/refresh-token.strategy';
import { GoogleUser } from '../interfaces/jwt-payload.interface';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // POST /auth/register
  // ──────────────────────────────────────────────────────────────

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req.ip, req.headers['user-agent']);
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/login
  // ──────────────────────────────────────────────────────────────

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip, req.headers['user-agent']);
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/verify-email  (For API clients like Postman/Frontend)
  // ──────────────────────────────────────────────────────────────

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  // ──────────────────────────────────────────────────────────────
  // GET /auth/verify-email  (For direct browser links)
  // ──────────────────────────────────────────────────────────────

  @Public()
  @Get('verify-email')
  async verifyEmailGet(@Query('token') token: string, @Res() res: Response) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    try {
      await this.authService.verifyEmail(token);
      
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
      // Redirect to frontend login on success
      res.redirect(`${frontendUrl}/login?verified=true`);
    } catch (error: any) {
      // In a real app, redirect to a frontend error page
      res.status(HttpStatus.BAD_REQUEST).send(error.message || 'Invalid or expired token');
    }
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/resend-verification
  // ──────────────────────────────────────────────────────────────

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/forgot-password
  // ──────────────────────────────────────────────────────────────

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/reset-password
  // ──────────────────────────────────────────────────────────────

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/2fa/setup
  // ──────────────────────────────────────────────────────────────

  @Post('2fa/setup')
  @UseGuards(VerifiedEmailGuard)
  @HttpCode(HttpStatus.OK)
  async setup2fa(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.authService.setup2fa(user.userId);
    return {
      success: true,
      message: 'Scan the QR code with your authenticator app',
      data: result,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/2fa/enable
  // ──────────────────────────────────────────────────────────────

  @Post('2fa/enable')
  @UseGuards(VerifiedEmailGuard)
  @HttpCode(HttpStatus.OK)
  async enable2fa(@CurrentUser() user: AuthenticatedUser, @Body() dto: Enable2faDto) {
    return this.authService.enable2fa(user.userId, dto.otp);
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/2fa/disable
  // ──────────────────────────────────────────────────────────────

  @Post('2fa/disable')
  @UseGuards(VerifiedEmailGuard)
  @HttpCode(HttpStatus.OK)
  async disable2fa(@CurrentUser() user: AuthenticatedUser, @Body() dto: Disable2faDto) {
    return this.authService.disable2fa(user.userId, dto.password);
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/2fa/verify
  // ──────────────────────────────────────────────────────────────

  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verify2fa(@Body() dto: Verify2faDto, @Req() req: Request) {
    return this.authService.verify2fa(dto.userId, dto.otp, req.ip, req.headers['user-agent']);
  }

  // ──────────────────────────────────────────────────────────────
  // GET /auth/google — Initiate Google OAuth flow
  // ──────────────────────────────────────────────────────────────

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(): Promise<void> {
    // Passport redirects to Google — this body never executes
  }

  // ──────────────────────────────────────────────────────────────
  // GET /auth/google/callback — Google OAuth callback
  // ──────────────────────────────────────────────────────────────

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(
    @Req() req: Request & { user: GoogleUser },
    @Res({ passthrough: false }) res: Response,
  ) {
    const response = await this.authService.googleLogin(
      req.user,
      req.ip,
      req.headers['user-agent'],
    );

    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ??
      'http://localhost:3001';

    if (response.data.requiresTwoFactor && response.data.userId) {
      return res.redirect(
        `${frontendUrl}/two-factor/verify?userId=${encodeURIComponent(response.data.userId)}`,
      );
    }

    const { accessToken, refreshToken } = response.data;

    if (!accessToken || !refreshToken) {
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    return res.redirect(
      `${frontendUrl}/login/callback?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`,
    );
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/refresh — Refresh Token Rotation
  // ──────────────────────────────────────────────────────────────

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async refresh(@CurrentUser() tokenData: RefreshTokenRequest) {
    const tokens = await this.authService.refresh(
      tokenData.userId,
      tokenData.sessionId,
      tokenData.rawRefreshToken,
    );

    return {
      success: true,
      message: 'Tokens refreshed successfully',
      data: tokens,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/logout — Revoke current session
  // ──────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.sessionId);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/logout-all — Revoke all sessions
  // ──────────────────────────────────────────────────────────────

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logoutAll(user.userId);

    return {
      success: true,
      message: 'Logged out from all devices successfully',
    };
  }

  // ──────────────────────────────────────────────────────────────
  // GET /auth/sessions — List active sessions
  // ──────────────────────────────────────────────────────────────

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  async getSessions(@CurrentUser() user: AuthenticatedUser) {
    const sessions = await this.authService.getActiveSessions(
      user.userId,
      user.sessionId,
    );

    return {
      success: true,
      data: { sessions },
    };
  }

  // ──────────────────────────────────────────────────────────────
  // DELETE /auth/sessions/:id — Revoke a session
  // ──────────────────────────────────────────────────────────────

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') sessionId: string,
  ) {
    await this.authService.revokeSession(user.userId, sessionId, user.sessionId);

    return {
      success: true,
      message: 'Session revoked successfully',
    };
  }
}
