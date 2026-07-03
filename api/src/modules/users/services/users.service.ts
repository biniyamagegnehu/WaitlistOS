import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Provider, Role, User, UserStatus } from '@prisma/client';
import { UpdateProfileDto } from '../dto/update-profile.dto';

export type SafeUser = Omit<User, 'passwordHash'>;

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

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by their ID. Throws NotFoundException if not found.
   */
  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User not found`);
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
   * Throws ConflictException if email already exists.
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
    await this.findById(id); // Ensures user exists

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
   * Strips sensitive fields from a User object before returning to clients.
   */
  sanitize(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safe } = user;
    return safe;
  }
}
