import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ChangeEmailDto } from '../dto/change-email.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { VerifiedEmailGuard } from '../../auth/guards/verified-email.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { Throttle } from '@nestjs/throttler';
import { PaymentService } from '../../payments/payment.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * GET /users/me
   * Returns the currently authenticated user's profile and their Founder record.
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const dbUser = await this.usersService.findById(user.userId);
    const safeUser = this.usersService.sanitize(dbUser);

    const founder = await this.prisma.founder.findUnique({
      where: { userId: user.userId },
    });

    const subscription = await this.paymentService.getSubscriptionSummary(user.userId);

    return {
      success: true,
      data: {
        user: {
          id: safeUser.id,
          email: safeUser.email,
          role: safeUser.role,
          provider: safeUser.provider,
          firstName: safeUser.firstName,
          lastName: safeUser.lastName,
          avatar: safeUser.avatar,
          status: safeUser.status,
          emailVerifiedAt: safeUser.emailVerifiedAt,
          twoFactorEnabled: safeUser.twoFactorEnabled,
          hasPassword: !!dbUser.passwordHash,
          lastLoginAt: safeUser.lastLoginAt,
          createdAt: safeUser.createdAt,
          updatedAt: safeUser.updatedAt,
        },
        founder: founder ?? null,
        subscription,
      },
    };
  }

  /**
   * PATCH /users/profile
   * Updates the authenticated user's profile.
   */
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(user.userId, dto);

    return {
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    };
  }

  /**
   * PATCH /users/change-password
   */
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(user.userId, dto, user.sessionId);
    return {
      success: true,
      message: 'Password changed successfully. All other active sessions have been logged out.',
      data: {},
    };
  }

  /**
   * PATCH /users/change-email
   */
  @Patch('change-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(VerifiedEmailGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async changeEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangeEmailDto,
  ) {
    await this.usersService.changeEmail(user.userId, dto);
    return {
      success: true,
      message: 'A verification link has been sent to your new email address.',
      data: {},
    };
  }

  /**
   * GET /users/change-email/verify
   * Verify an email change via token.
   */
  @Public()
  @Get('change-email/verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmailChange(@Query('token') token: string) {
    await this.usersService.verifyEmailChange(token);
    return {
      success: true,
      message: 'Email address updated successfully.',
      data: {},
    };
  }
}
