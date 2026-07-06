import { registerAs } from '@nestjs/config';

export const plansConfig = registerAs('plans', () => ({
  currency: process.env.PLAN_CURRENCY ?? 'USD',
  freeMaxWaitlists: parseInt(process.env.FREE_MAX_WAITLISTS ?? '1', 10),
  freeMaxParticipants: parseInt(process.env.FREE_MAX_PARTICIPANTS ?? '500', 10),
  starterPrice: parseFloat(process.env.PLAN_STARTER_PRICE ?? '19'),
  starterMaxWaitlists: parseInt(process.env.PLAN_STARTER_MAX_WAITLISTS ?? '5', 10),
  starterMaxParticipants: parseInt(
    process.env.PLAN_STARTER_MAX_PARTICIPANTS ?? '5000',
    10,
  ),
  proPrice: parseFloat(process.env.PLAN_PRO_PRICE ?? '49'),
}));
