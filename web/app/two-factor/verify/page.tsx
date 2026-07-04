"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { AuthForm } from "@/components/features/auth/forms/auth-form";
import { OTPInput } from "@/components/ui/otp-input";
import { twoFactorSchema, type TwoFactorFormData } from "@/lib/validations/auth";
import { verifyTwoFactor } from "@/services/auth";
import { tokenStorage } from "@/lib/axios";

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const [userId] = React.useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("pending_2fa_user_id") ?? "";
  });

  React.useEffect(() => {
    if (!userId) {
      router.replace("/login");
    }
  }, [router, userId]);

  const handleVerify = async (data: TwoFactorFormData) => {
    try {
      const response = await verifyTwoFactor({ ...data, userId });
      const { accessToken, refreshToken } = response.data;

      if (accessToken && refreshToken) {
        tokenStorage.setTokens(accessToken, refreshToken);
      }
      
      sessionStorage.removeItem("pending_2fa_user_id");
      
      router.replace("/dashboard");
    } catch (error: unknown) {
      throw error;
    }
  };

  return (
    <AuthLayout
      title="Two-factor authentication"
      description="Enter the 6-digit code from your authenticator app"
      backLinkHref="/login"
      backLinkText="Back to login"
    >
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="bg-white/5 p-4 rounded-full">
            <Shield className="h-8 w-8 text-indigo-400" />
          </div>
        </div>

        <AuthForm
          schema={twoFactorSchema}
          onSubmit={handleVerify}
          submitText="Verify"
        >
          {({ watch, setValue, formState: { errors } }) => (
            <div className="flex justify-center">
              <OTPInput
                length={6}
                value={watch("code") || ""}
                onChange={(value) => setValue("code", value, { shouldValidate: true })}
                error={errors.code?.message}
                autoFocus
              />
            </div>
          )}
        </AuthForm>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Use a different method
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
