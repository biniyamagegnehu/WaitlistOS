// ── User Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'founder';
  provider: 'local' | 'google';
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  hasPassword: boolean;
  status?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Founder {
  id: string;
  userId: string;
  companyName?: string;
  industry?: string;
  companyDescription?: string;
  country?: string;
  teamSize?: string;
  companyLogo?: string;
  companyWebsite?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ── Auth Response Types ─────────────────────────────────────────────────────────────
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user?: User;
    founder?: Founder | null;
    accessToken?: string;
    /** Issued only as an httpOnly cookie by the API — never stored in the browser. */
    refreshToken?: never;
    requiresTwoFactor?: boolean;
    userId?: string;
    onboardingCompleted?: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// ── Session Types ───────────────────────────────────────────────────────────────────
export interface Session {
  id: string;
  userId: string;
  token: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

// ── Two Factor Types ───────────────────────────────────────────────────────────────
export interface TwoFactorSetup {
  qrCode: string;
  secret: string;
  backupCodes: string[];
  qrCodeDataUrl?: string;
}

export interface TwoFactorVerify {
  code: string;
  userId?: string;
}

// ── Password Reset Types ───────────────────────────────────────────────────────────
export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// ── Email Verification Types ───────────────────────────────────────────────────────
export interface VerifyEmailData {
  token: string;
}

export interface ResendVerificationData {
  email: string;
}

// ── Change Email Types ─────────────────────────────────────────────────────────────
export interface ChangeEmailData {
  newEmail: string;
  password: string;
}

export interface VerifyChangeEmailData {
  token: string;
}

// ── API Error Types ────────────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
