"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { AuthForm } from "@/components/features/auth/forms/auth-form";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/auth";
import { resetPassword } from "@/services/auth";
import { Alert } from "@/components/ui/alert";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const error = token
    ? null
    : "Invalid or missing reset token. Please request a new password reset.";

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    if (!token) {
      throw new Error("Invalid reset token");
    }
    await resetPassword({ ...data, token });
    router.replace("/login");
  };

  return (
    <AuthLayout
      title="Set new password"
      description="Create a new secure password for your account"
      backLinkHref="/login"
      backLinkText="Back to login"
    >
      {error && (
        <Alert variant="error" title="Error" className="mb-4">
          {error}
        </Alert>
      )}

      <AuthForm
        schema={resetPasswordSchema}
        onSubmit={handleResetPassword}
        submitText="Reset password"
        onSuccessMessage="Password reset successfully"
        isSubmitting={!token}
      >
        {({ register, formState: { errors } }) => (
          <>
            <PasswordInput
              label="New password"
              placeholder="••••••••"
              showStrength
              error={errors.password?.message}
              helper="Must be at least 8 characters with uppercase, lowercase, number, and special character"
              {...register("password")}
            />

            <PasswordInput
              label="Confirm new password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </>
        )}
      </AuthForm>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
