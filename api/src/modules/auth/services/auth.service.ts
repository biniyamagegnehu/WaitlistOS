import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersService } from '../../users/services/users.service';
import { SessionsService } from '../../sessions/sessions.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtPayload, JwtRefreshPayload, GoogleUser } from '../interfaces/jwt-payload.interface';
import { Provider, User, Founder, Session } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: Omit<User, 'passwordHash'>;
    founder: Founder | null;
    accessToken: string;
    refreshToken: string;
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

    // Atomically create User + Founder in a single transaction
    const { user, founder } = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName ?? null,
          lastName: dto.lastName ?? null,
          provider: Provider.EMAIL,
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

    const tokens = await this.generateTokensAndSession(user, founder, ipAddress, userAgent);

    this.logger.log(`New user registered: ${user.email}`);

    return this.buildAuthResponse('Registration successful', user, founder, tokens);
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

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user.id);

    const founder = await this.prisma.founder.findUnique({ where: { userId: user.id } });
    const tokens = await this.generateTokensAndSession(user, founder, ipAddress, userAgent);

    this.logger.log(`User logged in: ${user.email}`);

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

    return {
      success: true,
      message,
      data: {
        user: safeUser,
        founder: founder ?? null,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }
}
