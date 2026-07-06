import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { GoogleUser } from '../interfaces/jwt-payload.interface';

/**
 * GoogleStrategy
 * Handles Google OAuth 2.0 authentication flow.
 * Returns a structured GoogleUser object for use in AuthService.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('app.googleClientId') ?? '',
      clientSecret: configService.get<string>('app.googleClientSecret') ?? '',
      callbackURL: configService.get<string>('app.googleCallbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { name, emails, photos } = profile;
    const email = emails?.[0]?.value?.trim();

    if (!email) {
      done(new Error('Google account has no email address'), undefined);
      return;
    }

    const googleUser: GoogleUser = {
      email,
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      avatar: photos?.[0]?.value ?? null,
    };

    done(null, googleUser);
  }
}
