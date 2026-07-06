import { registerAs } from '@nestjs/config';

export const chapaConfig = registerAs('chapa', () => ({
  secretKey: process.env.CHAPA_SECRET_KEY ?? '',
  publicKey: process.env.CHAPA_PUBLIC_KEY ?? '',
  webhookSecret: process.env.CHAPA_WEBHOOK_SECRET ?? '',
  baseUrl: process.env.CHAPA_BASE_URL ?? 'https://api.chapa.co/v1',
}));
