import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Provider } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(data: any) {
    const { email, password, name } = data;
    const existing = await this.prisma.founder.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const founder = await this.prisma.founder.create({
      data: {
        email,
        passwordHash,
        name,
        provider: Provider.EMAIL,
      },
    });

    return this.generateToken(founder.id, founder.email);
  }

  async login(data: any) {
    const { email, password } = data;
    const founder = await this.prisma.founder.findUnique({ where: { email } });
    
    if (!founder || !founder.passwordHash) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, founder.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    return this.generateToken(founder.id, founder.email);
  }

  async validateOAuthLogin(profile: any) {
    const { emails, displayName } = profile;
    const email = emails[0].value;

    let founder = await this.prisma.founder.findUnique({ where: { email } });

    if (!founder) {
      founder = await this.prisma.founder.create({
        data: {
          email,
          name: displayName,
          provider: Provider.GOOGLE,
        },
      });
    }

    return this.generateToken(founder.id, founder.email);
  }

  private generateToken(sub: string, email: string) {
    const payload = { sub, email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
