"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tokenStorage } from "@/lib/axios";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      tokenStorage.setTokens(accessToken, refreshToken);
      router.replace("/dashboard");
      return;
    }

    router.replace("/login");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d14] text-white">
      Signing you in...
    </div>
  );
}
