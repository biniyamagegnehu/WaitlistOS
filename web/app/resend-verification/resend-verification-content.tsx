"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { AuthForm } from "@/components/features/auth/forms/auth-form";
import { Input } from "@/components/ui/input";
import { resendVerificationSchema, type ResendVerificationFormData } from "@/lib/validations/auth";
import { resendVerificationEmail } from "@/services/auth";

export default function ResendVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const handleResend = async (data: ResendVerificationFormData) => {
    await resendVerificationEmail(data);
    router.replace("/login");
  };

  return (
    <AuthLayout
      title="Resend verification email"
      description="Enter your email to receive a new verification link"
      backLinkHref="/login"
      backLinkText="Back to login"
    >
      <AuthForm
        schema={resendVerificationSchema}
        defaultValues={{ email }}
        onSubmit={handleResend}
        submitText="Send verification email"
        onSuccessMessage="Verification email sent successfully"
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
            error={errors.email?.message}
            {...register("email")}
          />
        )}
      </AuthForm>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already verified?{" "}
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
