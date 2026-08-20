import { registerAs } from '@nestjs/config';

export const monetizationConfig = registerAs('monetization', () => ({
  platformFeePercentage: parseInt(process.env.PLATFORM_FEE_PERCENTAGE || '10', 10),
}));
