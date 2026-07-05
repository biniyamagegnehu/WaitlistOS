import type { SettingsTab } from "@/types/dashboard";

export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  waitlists: "/dashboard/waitlists",
  waitlist: (id: string) => `/dashboard/waitlists/${id}`,
  settings: "/dashboard/settings",
  settingsTab: (tab: SettingsTab) => `/dashboard/settings?tab=${tab}`,
  profile: "/dashboard/profile",
  security: "/dashboard/security",
  sessions: "/dashboard/sessions",
  twoFactorSetup: "/two-factor/setup",
  twoFactorDisable: "/two-factor/disable",
  twoFactorVerify: "/two-factor/verify",
  verifyEmail: "/verify-email",
  resendVerification: "/resend-verification",
  create: "/create",
  waitlistPublic: (slug: string) => `/w/${slug}`,
} as const;
