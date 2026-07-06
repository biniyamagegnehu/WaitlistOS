"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { routes } from "@/lib/routes";
import { LoadingScreen } from "@/components/layouts/loading-screen";

export default function LoginCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { applyAuthResponse, refreshUser } = useAuth();

  React.useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    if (error) {
      router.replace(`${routes.login}?error=${encodeURIComponent(error)}`);
      return;
    }

    if (accessToken && refreshToken) {
      applyAuthResponse({ accessToken, refreshToken });
      void refreshUser().finally(() => {
        router.replace(routes.dashboard);
      });
      return;
    }

    router.replace(routes.login);
  }, [router, searchParams, applyAuthResponse, refreshUser]);

  return <LoadingScreen message="Signing you in…" />;
}
