"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { AuthForm } from "@/components/features/auth/forms/auth-form";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";
import { forgotPassword } from "@/services/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    await forgotPassword(data);
    router.replace("/login");
  };

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email and we'll send you a reset link"
      backLinkHref="/login"
      backLinkText="Back to login"
    >
      <AuthForm
        schema={forgotPasswordSchema}
        onSubmit={handleForgotPassword}
        submitText="Send reset link"
        onSuccessMessage="Password reset link sent to your email"
        onSuccess={() => {
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }}
      >
        {({ register, formState: { errors } }) => (
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message as string | undefined}
            {...register("email")}
          />
        )}
      </AuthForm>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-primary transition-colors hover:text-primary-hover"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
