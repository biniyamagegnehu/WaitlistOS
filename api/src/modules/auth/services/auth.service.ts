import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersService } from '../../users/services/users.service';
import { SessionsService } from '../../sessions/sessions.service';
import { EmailsService } from '../../emails/emails.service';
import { TwoFactorService, TwoFactorSetupResult } from './two-factor.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtPayload, JwtRefreshPayload, GoogleUser } from '../interfaces/jwt-payload.interface';
import { Provider, User, Founder, Session } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const BCRYPT_ROUNDS = 10;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user?: Omit<User, 'passwordHash' | 'twoFactorSecret'>;
    founder?: Founder | null;
    accessToken?: string;
    refreshToken?: string;
    requiresTwoFactor?: boolean;
    userId?: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly emailsService: EmailsService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // Register
  // ──────────────────────────────────────────────────────────────

  async register(
    dto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Generate verification token using SHA-256
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresInMs = this.configService.get<number>('app.emailVerificationExpiresInMs', 86400000);
    const expiresAt = new Date(Date.now() + expiresInMs);

    // Atomically create User + Founder
    const { user, founder } = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName ?? null,
          lastName: dto.lastName ?? null,
          provider: Provider.EMAIL,
          emailVerificationToken: hashedToken,
          emailVerificationExpiresAt: expiresAt,
        },
      });

      const newFounder = await tx.founder.create({
        data: {
          userId: newUser.id,
          email: newUser.email,
          name: dto.firstName
            ? [dto.firstName, dto.lastName].filter(Boolean).join(' ')
            : null,
        },
      });

      return { user: newUser, founder: newFounder };
    });

    // Queue verification email
    await this.emailsService.queueVerificationEmail(user.email, rawToken, user.firstName);

    // Do NOT generate tokens, user must verify email first
    this.logger.log(`New user registered (pending verification): ${user.email}`);

    return {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: this.usersService.sanitize(user),
        founder,
      },
    };
  }

  // ──────────────────────────────────────────────────────────────
  // Verify Email
  // ──────────────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<AuthResponse> {
    // Hash the token using SHA-256 and find the user by the hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiresAt: { gt: new Date() },
        status: 'PENDING_VERIFICATION',
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    this.logger.log(`Email verified for user: ${updatedUser.email}`);

    return {
      success: true,
      message: 'Email verified successfully. You can now log in.',
      data: {},
    };
  }

  // ──────────────────────────────────────────────────────────────
  // Resend Verification
  // ──────────────────────────────────────────────────────────────

  async resendVerification(email: string): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(email);

    if (!user || user.status === 'ACTIVE') {
      // Return success to avoid email enumeration
      return { success: true, message: 'Verification email sent if account exists and is pending.', data: {} };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresInMs = this.configService.get<number>('app.emailVerificationExpiresInMs', 86400000);
    const expiresAt = new Date(Date.now() + expiresInMs);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiresAt: expiresAt,
      },
    });

    await this.emailsService.queueVerificationEmail(user.email, rawToken, user.firstName);

    return { success: true, message: 'Verification email sent if account exists and is pending.', data: {} };
  }

  // ──────────────────────────────────────────────────────────────
  // Login
  // ──────────────────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account temporarily locked due to too many failed login attempts. Please try again later.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id, user.failedLoginAttempts);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0) {
      await this.prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    }

    if (user.status === 'PENDING_VERIFICATION') {
      throw new ForbiddenException('Please verify your email address before logging in.');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Your account has been banned.');
    }

    // Handle 2FA
    if (user.twoFactorEnabled) {
      return {
        success: true,
        message: 'Two-factor authentication required',
        data: {
          requiresTwoFactor: true,
          userId: user.id,
        },
      };
    }

    await this.usersService.updateLastLogin(user.id);

    // Send new login notification asynchronously
    if (ipAddress || userAgent) {
      await this.emailsService.queueNewLoginNotification(user.email, ipAddress ?? 'Unknown', userAgent ?? 'Unknown', user.firstName);
    }

    const founder = await this.prisma.founder.findUnique({ where: { userId: user.id } });
    const tokens = await this.generateTokensAndSession(user, founder, ipAddress, userAgent);

    this.logger.log(`User logged in: ${user.email}`);

    return this.buildAuthResponse('Login successful', user, founder, tokens);
  }

  private async handleFailedLogin(userId: string, currentAttempts: number) {
    const maxAttempts = this.configService.get<number>('app.maxLoginAttempts', 5);
    const lockoutMs = this.configService.get<number>('app.lockoutDurationMs', 900000);
    
    const attempts = currentAttempts + 1;
    let lockedUntil: Date | null = null;

    if (attempts >= maxAttempts) {
      lockedUntil = new Date(Date.now() + lockoutMs);
      this.logger.warn(`Account locked: ${userId}`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil,
      },
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Forgot Password
  // ──────────────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(email);

    if (!user || user.provider !== Provider.EMAIL) {
      return { success: true, message: 'If that email exists, a reset link has been sent.', data: {} };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresInMs = this.configService.get<number>('app.passwordResetExpiresInMs', 3600000);
    const expiresAt = new Date(Date.now() + expiresInMs);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: expiresAt,
      },
    });

    await this.emailsService.queuePasswordResetEmail(user.email, rawToken, user.firstName);

    return { success: true, message: 'If that email exists, a reset link has been sent.', data: {} };
  }

  // ──────────────────────────────────────────────────────────────
  // Reset Password
  // ──────────────────────────────────────────────────────────────

  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    // Hash the token using SHA-256 and find the user by the hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    // Revoke all existing sessions so they have to log in with new password
    await this.sessionsService.revokeAll(user.id);
    await this.emailsService.queuePasswordChangedEmail(user.email, user.firstName);

    this.logger.log(`Password reset successful for user: ${user.email}`);

    return { success: true, message: 'Password has been reset successfully. Please log in.', data: {} };
  }

  // ──────────────────────────────────────────────────────────────
  // Two-Factor Authentication
  // ──────────────────────────────────────────────────────────────

  async setup2fa(userId: string): Promise<TwoFactorSetupResult> {
    const user = await this.usersService.findById(userId);
    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    const result = await this.twoFactorService.generateSecret(user.email);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: result.secret },
    });

    return result;
  }

  async enable2fa(userId: string, otp: string): Promise<AuthResponse> {
    const user = await this.usersService.findById(userId);
    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication setup not initiated');
    }

    const isValid = this.twoFactorService.verifyToken(user.twoFactorSecret, otp);
    if (!isValid) {
      throw new BadRequestException('Invalid two-factor authentication code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    await this.emailsService.queueTwoFactorEnabledEmail(user.email, user.firstName);
    this.logger.log(`2FA enabled for user: ${user.email}`);

    return { success: true, message: 'Two-factor authentication enabled successfully', data: {} };
  }

  async disable2fa(userId: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.findById(userId);
    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Cannot disable 2FA for OAuth users');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    await this.emailsService.queueTwoFactorDisabledEmail(user.email, user.firstName);
    this.logger.log(`2FA disabled for user: ${user.email}`);

    return { success: true, message: 'Two-factor authentication disabled successfully', data: {} };
  }

  async verify2fa(userId: string, otp: string, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await this.usersService.findById(userId);
    
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    const isValid = this.twoFactorService.verifyToken(user.twoFactorSecret, otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid two-factor authentication code');
    }

    await this.usersService.updateLastLogin(user.id);
    
    if (ipAddress || userAgent) {
      await this.emailsService.queueNewLoginNotification(user.email, ipAddress ?? 'Unknown', userAgent ?? 'Unknown', user.firstName);
    }

    const founder = await this.prisma.founder.findUnique({ where: { userId: user.id } });
    const tokens = await this.generateTokensAndSession(user, founder, ipAddress, userAgent);

    return this.buildAuthResponse('Login successful', user, founder, tokens);
  }

  // ──────────────────────────────────────────────────────────────
  // Google OAuth Login
  // ──────────────────────────────────────────────────────────────

  async googleLogin(
    googleUser: GoogleUser,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    let user = await this.usersService.findByEmail(googleUser.email);
    let founder: Founder | null;

    if (user) {
      // Existing user — log them in
      await this.usersService.updateLastLogin(user.id);
      founder = await this.prisma.founder.findUnique({ where: { userId: user.id } });
    } else {
      // New user — create User + Founder atomically
      const result = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: googleUser.email,
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            avatar: googleUser.avatar,
            provider: Provider.GOOGLE,
            status: 'ACTIVE', // Google users are implicitly verified
            emailVerifiedAt: new Date(),
          },
        });

        const newFounder = await tx.founder.create({
          data: {
            userId: newUser.id,
            email: newUser.email,
            name: [googleUser.firstName, googleUser.lastName].filter(Boolean).join(' '),
          },
        });

        return { user: newUser, founder: newFounder };
      });

      user = result.user;
      founder = result.founder;
      this.logger.log(`New Google user registered: ${user.email}`);
    }

    // Google users don't trigger 2FA by default unless they set it up explicitly via email/pass addition
    if (user.twoFactorEnabled) {
      return {
        success: true,
        message: 'Two-factor authentication required',
        data: {
          requiresTwoFactor: true,
          userId: user.id,
        },
      };
    }

    const tokens = await this.generateTokensAndSession(user, founder, ipAddress, userAgent);

    return this.buildAuthResponse('Google login successful', user, founder, tokens);
  }

  // ──────────────────────────────────────────────────────────────
  // Refresh Token Rotation
  // ──────────────────────────────────────────────────────────────

  async refresh(
    userId: string,
    sessionId: string,
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.sessionsService.findValidSession(sessionId, userId);
    await this.sessionsService.verifyRefreshToken(session, rawRefreshToken);

    const user = await this.usersService.findById(userId);
    const founder = await this.prisma.founder.findUnique({ where: { userId } });

    const newRefreshToken = this.signRefreshToken(user.id, sessionId);
    await this.sessionsService.rotateRefreshToken(sessionId, newRefreshToken);

    const accessToken = this.signAccessToken(user, sessionId, founder);

    this.logger.log(`Token refreshed for user: ${user.email}, session: ${sessionId}`);

    return { accessToken, refreshToken: newRefreshToken };
  }

  // ──────────────────────────────────────────────────────────────
  // Logout
  // ──────────────────────────────────────────────────────────────

  async logout(sessionId: string): Promise<void> {
    await this.sessionsService.revoke(sessionId);
  }

  // ──────────────────────────────────────────────────────────────
  // Logout All Devices
  // ──────────────────────────────────────────────────────────────

  async logoutAll(userId: string): Promise<void> {
    await this.sessionsService.revokeAll(userId);
  }

  async getActiveSessions(userId: string, currentSessionId: string) {
    const sessions = await this.sessionsService.findActiveByUserId(userId);

    return sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      ipAddress: session.ipAddress ?? undefined,
      userAgent: session.userAgent ?? undefined,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      isCurrent: session.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string, currentSessionId: string): Promise<void> {
    if (sessionId === currentSessionId) {
      throw new BadRequestException('Cannot revoke the current session');
    }

    await this.sessionsService.findValidSession(sessionId, userId);
    await this.sessionsService.revoke(sessionId);
  }

  // ──────────────────────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────────────────────

  private async generateTokensAndSession(
    user: User,
    founder: Founder | null,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair & { session: Session }> {
    // Create session placeholder to get the session ID first
    const tempRefreshToken = this.signRefreshToken(user.id, 'PLACEHOLDER');
    const session = await this.sessionsService.create(user.id, tempRefreshToken, ipAddress, userAgent);

    // Now sign proper tokens with the real session ID
    const accessToken = this.signAccessToken(user, session.id, founder);
    const refreshToken = this.signRefreshToken(user.id, session.id);

    // Rotate the session to store the real refresh token hash
    await this.sessionsService.rotateRefreshToken(session.id, refreshToken);

    return { accessToken, refreshToken, session };
  }

  private signAccessToken(user: User, sessionId: string, founder: Founder | null): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwtAccessSecret') ?? '',
      expiresIn: (this.configService.get<string>('app.jwtAccessExpiresIn') ?? '15m') as any,
    });
  }

  private signRefreshToken(userId: string, sessionId: string): string {
    const payload: JwtRefreshPayload = {
      sub: userId,
      sessionId,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwtRefreshSecret') ?? '',
      expiresIn: (this.configService.get<string>('app.jwtRefreshExpiresIn') ?? '30d') as any,
    });
  }

  private buildAuthResponse(
    message: string,
    user: User,
    founder: Founder | null,
    tokens: TokenPair,
  ): AuthResponse {
    const safeUser = this.usersService.sanitize(user);
    // Remove 2FA secret from response
    const { twoFactorSecret, ...userWithoutSecret } = safeUser as any;

    return {
      success: true,
      message,
      data: {
        user: userWithoutSecret,
        founder: founder ?? null,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }
}
