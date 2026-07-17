"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { AuthForm } from "@/components/features/auth/forms/auth-form";
import { AuthDivider } from "@/components/features/auth/auth-divider";
import { GoogleAuthButton } from "@/components/features/auth/google-auth-button";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert } from "@/components/ui/alert";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { useAuth } from "@/contexts/auth-context";
import { routes } from "@/lib/routes";

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, googleLogin, isAuthenticated, isLoading } = useAuth();
  const authError = searchParams.get("error");
  const googleErrorMessage =
    authError === "google_auth_failed"
      ? "Google sign-in failed. Please try again or use email and password."
      : authError === "google_not_configured"
        ? "Google sign-in is not configured on this server."
        : null;

  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace(routes.dashboard);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const handleLogin = async (data: LoginFormData) => {
    const result = await login(data.email, data.password);
    if (result.requiresTwoFactor && result.userId) {
      sessionStorage.setItem("pending_2fa_user_id", result.userId);
      router.replace(routes.twoFactorVerify);
      return;
    }
    router.replace(routes.dashboard);
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your account to continue"
      backLinkHref={routes.home}
      backLinkText="Back to home"
    >
      {googleErrorMessage ? (
        <Alert variant="error" className="mb-4">
          {googleErrorMessage}
        </Alert>
      ) : null}

      <AuthForm
        schema={loginSchema}
        onSubmit={handleLogin}
        submitText="Sign in"
        onSuccessMessage="Login successful"
      >
        {({ register, formState: { errors } }) => (
          <>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message as string | undefined}
              {...register("email")}
              required
            />

            <PasswordInput
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message as string | undefined}
              {...register("password")}
              required
            />

            <div className="flex items-center justify-between">
              <Link
                href="/forgot-password"
                className="text-sm text-primary transition-colors hover:text-primary-hover"
              >
                Forgot password?
              </Link>
            </div>
          </>
        )}
      </AuthForm>

      <AuthDivider />
      <GoogleAuthButton onClick={googleLogin} label="Continue with Google" />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Do not have an account?{" "}
        <Link
          href={routes.register}
          className="font-medium text-primary transition-colors hover:text-primary-hover"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
