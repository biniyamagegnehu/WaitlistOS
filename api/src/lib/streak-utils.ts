export function computeEffectiveStreak(currentStreak: number, lastSuccessfulReferralAt: Date | null): number {
  if (!lastSuccessfulReferralAt || currentStreak === 0) {
    return 0;
  }

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const lastReferralDate = new Date(lastSuccessfulReferralAt);
  const lastReferralDay = new Date(Date.UTC(lastReferralDate.getUTCFullYear(), lastReferralDate.getUTCMonth(), lastReferralDate.getUTCDate()));

  const diffDays = Math.ceil(Math.abs(today.getTime() - lastReferralDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    return currentStreak;
  } else {
    return 0; // Streak has lapsed
  }
}

export function getStreakStatus(currentStreak: number, lastSuccessfulReferralAt: Date | null) {
  if (!lastSuccessfulReferralAt || currentStreak === 0) {
    return { activeStreak: 0, referredToday: false, active: false };
  }
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const lastReferralDate = new Date(lastSuccessfulReferralAt);
  const lastReferralDay = new Date(Date.UTC(lastReferralDate.getUTCFullYear(), lastReferralDate.getUTCMonth(), lastReferralDate.getUTCDate()));

  const diffDays = Math.ceil(Math.abs(today.getTime() - lastReferralDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { activeStreak: currentStreak, referredToday: true, active: true };
  } else if (diffDays === 1) {
    return { activeStreak: currentStreak, referredToday: false, active: true };
  } else {
    return { activeStreak: 0, referredToday: false, active: false };
  }
}
