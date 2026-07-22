import { User } from "@/types/auth";

type ApiUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  role: string;
  provider?: string;
  status?: string;
  emailVerifiedAt?: string | Date | null;
  twoFactorEnabled?: boolean;
  isEmailVerified?: boolean;
  isTwoFactorEnabled?: boolean;
  hasPassword?: boolean;
  lastLoginAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function normalizeRole(role: string): User["role"] {
  const lower = role.toLowerCase();
  if (lower === "admin") return "admin";
  if (lower === "founder") return "founder";
  return "user";
}

function normalizeProvider(provider?: string): User["provider"] {
  if (!provider) return "local";
  const lower = provider.toLowerCase();
  return lower === "google" ? "google" : "local";
}

function toIsoString(value: string | Date): string {
  return typeof value === "string" ? value : value.toISOString();
}

export function normalizeUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    firstName: apiUser.firstName ?? undefined,
    lastName: apiUser.lastName ?? undefined,
    avatar: apiUser.avatar ?? undefined,
    role: normalizeRole(apiUser.role),
    provider: normalizeProvider(apiUser.provider),
    isEmailVerified:
      apiUser.isEmailVerified ?? Boolean(apiUser.emailVerifiedAt),
    isTwoFactorEnabled:
      apiUser.isTwoFactorEnabled ?? apiUser.twoFactorEnabled ?? false,
    hasPassword: apiUser.hasPassword ?? false,
    status: apiUser.status,
    lastLoginAt: apiUser.lastLoginAt
      ? toIsoString(apiUser.lastLoginAt)
      : undefined,
    createdAt: toIsoString(apiUser.createdAt),
    updatedAt: toIsoString(apiUser.updatedAt),
  };
}
