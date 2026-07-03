import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';
import type { AuthenticatedUser } from '../interfaces/jwt-payload.interface';
import type { RefreshTokenRequest } from '../strategies/refresh-token.strategy';
import { GoogleUser } from '../interfaces/jwt-payload.interface';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  // GET /auth/google — Initiate Google OAuth flow
  // ──────────────────────────────────────────────────────────────

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(): Promise<void> {
    // Passport redirects to Google — this body never executes
  }

  // ──────────────────────────────────────────────────────────────
  // GET /auth/google/callback — Google OAuth callback
  // ──────────────────────────────────────────────────────────────

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request & { user: GoogleUser }, @Res() res: Response) {
    const response = await this.authService.googleLogin(
      req.user,
      req.ip,
      req.headers['user-agent'],
    );

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    const { accessToken, refreshToken } = response.data;

    // Redirect to frontend with tokens as query params
    // In production, prefer a more secure mechanism (e.g., httpOnly cookie or code exchange)
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
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
}
