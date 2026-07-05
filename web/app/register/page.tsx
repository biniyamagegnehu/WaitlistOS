"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, User } from "lucide-react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { AuthForm } from "@/components/features/auth/forms/auth-form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d14]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const handleRegister = async (data: RegisterFormData) => {
    await registerUser({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    router.replace(`/resend-verification?email=${encodeURIComponent(data.email)}`);
  };

  return (
    <AuthLayout
      title="Create an account"
      description="Start building your waitlist today"
      backLinkHref="/"
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
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <Input
                label="Last name"
                type="text"
                placeholder="Doe"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.lastName?.message}
                {...register("lastName")}
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message as string | undefined}
              {...register("email")}
            />

            <PasswordInput
              label="Password"
              placeholder="••••••••"
              showStrength
              error={errors.password?.message as string | undefined}
              helper="Must be at least 8 characters"
              {...register("password")}
            />

            <PasswordInput
              label="Confirm password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message as string | undefined}
              {...register("confirmPassword")}
            />
          </>
        )}
      </AuthForm>

      {/* Sign in link */}
      <p className="mt-6 text-center text-sm text-zinc-400">
        Already have an account?{" "}
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
