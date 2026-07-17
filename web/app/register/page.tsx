"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, User } from "lucide-react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { AuthForm } from "@/components/features/auth/forms/auth-form";
import { AuthDivider } from "@/components/features/auth/auth-divider";
import { GoogleAuthButton } from "@/components/features/auth/google-auth-button";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { useAuth } from "@/contexts/auth-context";
import { routes } from "@/lib/routes";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, googleLogin, isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace(routes.dashboard);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const handleRegister = async (data: RegisterFormData) => {
    await registerUser({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    router.replace(
      `${routes.resendVerification}?email=${encodeURIComponent(data.email)}`
    );
  };

  return (
    <AuthLayout
      title="Create an account"
      description="Start building your waitlist today"
      backLinkHref={routes.home}
      backLinkText="Back to home"
    >
      <AuthForm
        schema={registerSchema}
        onSubmit={handleRegister}
        submitText="Create account"
        onSuccessMessage="Account created successfully"
      >
        {({ register, formState: { errors } }) => (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                type="text"
                placeholder="John"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.firstName?.message as string | undefined}
                {...register("firstName")}
                required
              />
              <Input
                label="Last name"
                type="text"
                placeholder="Doe"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.lastName?.message as string | undefined}
                {...register("lastName")}
                required
              />
            </div>

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
              showStrength
              error={errors.password?.message as string | undefined}
              helper="Must be at least 8 characters"
              {...register("password")}
              required
            />

            <PasswordInput
              label="Confirm password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message as string | undefined}
              {...register("confirmPassword")}
              required
            />
          </>
        )}
      </AuthForm>

      <AuthDivider />
      <GoogleAuthButton onClick={googleLogin} label="Continue with Google" />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={routes.login}
          className="font-medium text-primary transition-colors hover:text-primary-hover"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
