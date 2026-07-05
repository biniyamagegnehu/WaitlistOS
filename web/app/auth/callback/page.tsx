"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tokenStorage } from "@/lib/axios";
import { useAuth } from "@/contexts/auth-context";
import { routes } from "@/lib/routes";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  React.useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      tokenStorage.setTokens(accessToken, refreshToken);
      void refreshUser().finally(() => {
        router.replace(routes.dashboard);
      });
      return;
    }

    router.replace(routes.login);
  }, [router, searchParams, refreshUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d14] text-white">
      Signing you in...
    </div>
  );
}
