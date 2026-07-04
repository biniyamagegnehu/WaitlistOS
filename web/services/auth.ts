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
} from "@/types/auth";

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
  user: NonNullable<AuthResponse["data"]["user"]>;
  founder?: AuthResponse["data"]["founder"];
}> {
  const response = await api.get("/users/me");
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
  await api.post("/auth/reset-password", {
    token: data.token,
    newPassword: data.password,
  });
}

export async function changePassword(data: ChangePasswordData): Promise<void> {
  await api.patch("/users/change-password", data);
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
// Note: Sessions endpoints are not yet implemented in the backend
// These functions are placeholders for future implementation
export async function getSessions(): Promise<Session[]> {
  // TODO: Implement when backend adds sessions endpoint
  throw new Error("Sessions endpoint not yet implemented in backend");
}

export async function revokeSession(_sessionId: string): Promise<void> {
  void _sessionId;
  // TODO: Implement when backend adds sessions endpoint
  throw new Error("Sessions endpoint not yet implemented in backend");
}

export async function revokeAllSessions(): Promise<void> {
  // Use auth logout-all endpoint instead
  await api.post("/auth/logout-all");
}
