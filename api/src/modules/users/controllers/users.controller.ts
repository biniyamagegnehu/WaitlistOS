import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /users/me
   * Returns the currently authenticated user's profile and their Founder record.
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const safeUser = {
      id: user.userId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };

    const founder = await this.prisma.founder.findUnique({
      where: { userId: user.userId },
    });

    return {
      success: true,
      data: {
        user: safeUser,
        founder: founder ?? null,
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
}
