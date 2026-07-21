"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, CheckCircle } from "lucide-react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { AuthForm } from "@/components/features/auth/forms/auth-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resendVerificationSchema, type ResendVerificationFormData } from "@/lib/validations/auth";
import { resendVerificationEmail } from "@/services/auth";

export default function ResendVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [emailSent, setEmailSent] = React.useState(!!email);
  const [sentToEmail, setSentToEmail] = React.useState(email);

  React.useEffect(() => {
    if (email) {
      setSentToEmail(email);
      setEmailSent(true);
    }
  }, [email]);

  const handleResend = async (data: ResendVerificationFormData) => {
    await resendVerificationEmail(data);
    setEmailSent(true);
    setSentToEmail(data.email);
  };

  const handleResendAgain = () => {
    setEmailSent(false);
  };

  if (emailSent) {
    return (
      <AuthLayout
        title="Check your email"
        description={`We've sent a verification link to ${sentToEmail}`}
        backLinkHref="/login"
        backLinkText="Back to login"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <p className="text-center text-muted-foreground mb-6">
            Click the link in the email to verify your account. The link will expire in 24 hours.
          </p>
          <Button
            variant="outline"
            onClick={handleResendAgain}
            className="w-full"
          >
            Resend verification email
          </Button>
        </div>

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
