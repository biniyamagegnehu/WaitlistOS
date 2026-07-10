import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Provider, Role, User, UserStatus } from '@prisma/client';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ChangeEmailDto } from '../dto/change-email.dto';
import { EmailsService } from '../../emails/emails.service';
import { SessionsService } from '../../sessions/sessions.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const BCRYPT_ROUNDS = 10;

export type SafeUser = Omit<User, 'passwordHash' | 'twoFactorSecret'>;

export interface CreateUserData {
  email: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  provider?: Provider;
  role?: Role;
  status?: UserStatus;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
    private readonly sessionsService: SessionsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Find a user by their ID. Throws NotFoundException if not found.
   */
  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Find a user by email. Returns null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Creates a new user record.
   */
  async create(data: CreateUserData): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    return this.prisma.user.create({ data });
  }

  /**
   * Updates a user's public profile fields.
   */
  async updateProfile(id: string, dto: UpdateProfileDto): Promise<SafeUser> {
    await this.findById(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
      },
    });

    return this.sanitize(updated);
  }

  /**
   * Updates the lastLoginAt timestamp.
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, dto: ChangePasswordDto, currentSessionId: string): Promise<void> {
    const user = await this.findById(userId);

    if (!user.passwordHash) {
      throw new BadRequestException('OAuth users cannot change password this way');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Incorrect current password');
    }

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        passwordChangedAt: new Date(),
      },
    });

    // Revoke all other sessions for security
    await this.prisma.session.updateMany({
      where: {
        userId,
        id: { not: currentSessionId },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await this.emailsService.queuePasswordChangedEmail(user.email, user.firstName);
    this.logger.log(`Password changed for user: ${user.email}`);
  }

  /**
   * Initiate email change process
   */
  async changeEmail(userId: string, dto: ChangeEmailDto): Promise<void> {
    const user = await this.findById(userId);

    if (user.provider !== Provider.EMAIL) {
      throw new BadRequestException('OAuth users cannot change email');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Password required to change email');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Incorrect password');
    }

    const existingUser = await this.findByEmail(dto.newEmail);
    if (existingUser) {
      throw new ConflictException('Email already in use by another account');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresInMs = this.configService.get<number>('app.pendingEmailExpiresInMs', 86400000);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: dto.newEmail,
        pendingEmailVerificationToken: hashedToken,
        pendingEmailVerificationExpiresAt: new Date(Date.now() + expiresInMs),
      },
    });

    await this.emailsService.queueEmailChangeVerification(dto.newEmail, rawToken, user.firstName);
    this.logger.log(`Email change initiated for user: ${user.email} -> ${dto.newEmail}`);
  }

  /**
   * Verify and confirm email change
   */
  async verifyEmailChange(token: string): Promise<void> {
    // Hash the token using SHA-256 and find the user by the hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: {
        pendingEmailVerificationToken: hashedToken,
        pendingEmailVerificationExpiresAt: { gt: new Date() },
      },
    });

    if (!user || !user.pendingEmail) {
      throw new BadRequestException('Invalid or expired email change token');
    }

    const oldEmail = user.email;
    const newEmail = user.pendingEmail;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: newEmail,
        pendingEmail: null,
        pendingEmailVerificationToken: null,
        pendingEmailVerificationExpiresAt: null,
      },
    });

    await this.emailsService.queueEmailChangedConfirmation(oldEmail, newEmail, user.firstName);
    this.logger.log(`Email changed successfully: ${oldEmail} -> ${newEmail}`);
  }

  /**
   * Strips sensitive fields
   */
  sanitize(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _hash, twoFactorSecret: _secret, ...safe } = user;
    return safe;
  }
}
