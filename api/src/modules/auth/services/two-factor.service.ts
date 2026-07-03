import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

export interface TwoFactorSetupResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly issuer: string;

  constructor(private readonly configService: ConfigService) {
    this.issuer = this.configService.get<string>('app.twoFactorIssuer', 'WaitlistOS');
    
    // Configure otplib
    authenticator.options = {
      window: 1, // Allow 1 step before/after for slight time drift
    };
  }

  /**
   * Generates a new TOTP secret for the given email, returns the secret,
   * otpauth URL, and a base64 encoded QR code for scanning.
   */
  async generateSecret(email: string): Promise<TwoFactorSetupResult> {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, this.issuer, secret);
    
    try {
      const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
      return {
        secret,
        otpauthUrl,
        qrCodeDataUrl,
      };
    } catch (error) {
      this.logger.error('Failed to generate QR code data URL', error);
      throw new Error('Failed to generate Two-Factor Authentication QR code');
    }
  }

  /**
   * Verifies an OTP token against a given secret.
   */
  verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      return false;
    }
  }
}
