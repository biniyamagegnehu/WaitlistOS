import { z } from "zod";

// ── Login Schema ─────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ── Register Schema ───────────────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address")
      .max(255, "Email is too long")
      .transform((val) => val.toLowerCase().trim()),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
    firstName: z.string().max(50, "First name must not exceed 50 characters").optional(),
    lastName: z.string().max(50, "Last name must not exceed 50 characters").optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ── Forgot Password Schema ─────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ── Reset Password Schema ─────────────────────────────────────────────────────────
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    newPassword: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ── Change Password Schema ─────────────────────────────────────────────────────────
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ── Change Email Schema ────────────────────────────────────────────────────────────
export const changeEmailSchema = z.object({
  newEmail: z
    .string()
    .min(1, "New email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

// ── Update Profile Schema ───────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  firstName: z.string().max(50, "First name must not exceed 50 characters").optional(),
  lastName: z.string().max(50, "Last name must not exceed 50 characters").optional(),
  avatar: z.string().url("Avatar must be a valid URL").optional().or(z.literal("")),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// ── Two Factor Schema ──────────────────────────────────────────────────────────────
export const twoFactorSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

export type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

// ── Resend Verification Schema ─────────────────────────────────────────────────────
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

export type ResendVerificationFormData = z.infer<typeof resendVerificationSchema>;
