"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { verifyEmail } from "@/services/auth";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuth } from "@/contexts/auth-context";
import { tokenStorage } from "@/lib/axios";
import { routes } from "@/lib/routes";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { refreshUser, patchUser } = useAuth();

  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">(
    token ? "idle" : "error"
  );
  const [message, setMessage] = React.useState(
    token ? "" : "Invalid or missing verification token"
  );
  const [redirectTarget, setRedirectTarget] = React.useState(routes.login);

  const handleVerify = React.useCallback(async () => {
    if (!token) return;

    setStatus("loading");
    try {
      await verifyEmail({ token });
      setStatus("success");
      setMessage("Email verified successfully");

      const hasSession = !!tokenStorage.getAccessToken();
      if (hasSession) {
        patchUser({ isEmailVerified: true });
        await refreshUser();
      }

      const nextRoute = hasSession ? routes.profile : routes.login;
      setRedirectTarget(nextRoute);

      setTimeout(() => {
        router.replace(nextRoute);
      }, 2000);
    } catch (error: unknown) {
      setStatus("error");
      setMessage(
        getApiErrorMessage(error, "Failed to verify email. The link may be expired or invalid.")
      );
    }
  }, [router, token, refreshUser, patchUser]);

  React.useEffect(() => {
    if (token) {
      const timer = window.setTimeout(() => {
        void handleVerify();
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [handleVerify, token]);

  const handleResend = () => {
    router.replace(routes.resendVerification);
  };

  const isLoggedIn = redirectTarget === routes.profile;

  return (
    <AuthLayout
      title="Verify your email"
      description="Confirm your email address to continue"
      showBackLink={false}
    >
      <div className="text-center py-8">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-12 w-12 text-indigo-400 animate-spin" />
            <p className="text-zinc-400">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="h-12 w-12 text-emerald-400" />
            <Alert variant="success" title="Success" className="w-full">
              {message}
            </Alert>
            <p className="text-sm text-zinc-400">
              Redirecting{isLoggedIn ? " to your profile" : " to login"}...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-12 w-12 text-red-400" />
            <Alert variant="error" title="Verification failed" className="w-full">
              {message}
            </Alert>
            <div className="flex flex-col gap-3 w-full mt-4">
              <Button onClick={handleResend} variant="secondary">
                Request new verification email
              </Button>
              <Link href={routes.login} className="w-full">
                <Button variant="ghost" className="w-full">
                  Back to login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
