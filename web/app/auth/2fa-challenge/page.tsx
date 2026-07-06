"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingScreen } from "@/components/layouts/loading-screen";

function AuthTwoFactorChallengeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const userId = searchParams.get("userId");

    if (userId) {
      sessionStorage.setItem("pending_2fa_user_id", userId);
      router.replace("/two-factor/verify");
      return;
    }

    router.replace("/login");
  }, [router, searchParams]);

  return <LoadingScreen message="Opening two-factor verification…" />;
}

export default function AuthTwoFactorChallengePage() {
  return (
    <Suspense fallback={<LoadingScreen message="Opening two-factor verification…" />}>
      <AuthTwoFactorChallengeContent />
    </Suspense>
  );
}
