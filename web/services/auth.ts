import { api } from "@/lib/axios";
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData,
  VerifyEmailData,
  ResendVerificationData,
  ChangeEmailData,
  VerifyChangeEmailData,
  TwoFactorSetup,
  TwoFactorVerify,
  Session,
  User,
} from "@/types/auth";
import { normalizeUser } from "@/lib/user";

// ── Authentication ───────────────────────────────────────────────────────────────
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", credentials);
  return response.data;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", data);
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function getCurrentUser(): Promise<{
  user: User;
  founder?: AuthResponse["data"]["founder"];
}> {
  const response = await api.get<{
    success: boolean;
    data: { user: User; founder?: AuthResponse["data"]["founder"] };
  }>("/users/me");

  return {
    user: normalizeUser(response.data.data.user),
    founder: response.data.data.founder,
  };
}

export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}): Promise<{ user: User }> {
  const response = await api.patch<{ success: boolean; data: { user: User } }>(
    "/users/profile",
    data
  );
  return response.data.data;
}

// ── Google Auth ──────────────────────────────────────────────────────────────────
export function getGoogleAuthUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
  return `${apiUrl}/api/auth/google`;
}

// ── Password Reset ───────────────────────────────────────────────────────────────
export async function forgotPassword(data: ForgotPasswordData): Promise<void> {
  await api.post("/auth/forgot-password", data);
}

export async function resetPassword(data: ResetPasswordData): Promise<void> {
  await api.post("/auth/reset-password", data);
}

export async function changePassword(data: ChangePasswordData): Promise<void> {
  await api.patch("/users/change-password", data);
}

export async function setPassword(data: {
  password: string;
  confirmPassword: string;
}): Promise<void> {
  await api.post("/auth/set-password", data);
}

// ── Email Verification ───────────────────────────────────────────────────────────
export async function verifyEmail(data: VerifyEmailData): Promise<void> {
  await api.post("/auth/verify-email", data);
}

export async function resendVerificationEmail(
  data: ResendVerificationData
): Promise<void> {
  await api.post("/auth/resend-verification", data);
}

// ── Change Email ─────────────────────────────────────────────────────────────────
export async function changeEmail(data: ChangeEmailData): Promise<void> {
  await api.patch("/users/change-email", data);
}

export async function verifyChangeEmail(data: VerifyChangeEmailData): Promise<void> {
  await api.get(`/users/change-email/verify?token=${data.token}`);
}

// ── Two Factor Authentication ─────────────────────────────────────────────────────
export async function setupTwoFactor(): Promise<TwoFactorSetup> {
  const response = await api.post<{
    success: boolean;
    data: TwoFactorSetup;
  }>("/auth/2fa/setup");
  const data = response.data.data;
  return {
    secret: data.secret,
    qrCode: data.qrCode ?? data.qrCodeDataUrl,
    backupCodes: data.backupCodes ?? [],
  };
}

export async function enableTwoFactor(data: TwoFactorVerify): Promise<void> {
  await api.post("/auth/2fa/enable", { otp: data.code });
}

export async function disableTwoFactor(data: { password: string }): Promise<void> {
  await api.post("/auth/2fa/disable", data);
}

export async function verifyTwoFactor(data: TwoFactorVerify): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/2fa/verify", {
    userId: data.userId,
    otp: data.code,
  });
  return response.data;
}

// ── Sessions ─────────────────────────────────────────────────────────────────────
export async function getSessions(): Promise<Session[]> {
  const response = await api.get<{
    success: boolean;
    data: { sessions: Session[] };
  }>("/auth/sessions");
  return response.data.data.sessions;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await api.delete(`/auth/sessions/${sessionId}`);
}

export async function revokeAllSessions(): Promise<void> {
  // Use auth logout-all endpoint instead
  await api.post("/auth/logout-all");
}
