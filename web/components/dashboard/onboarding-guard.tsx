"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, founder, isLoading } = useAuth();
  const router = useRouter();
  const isChecking = React.useRef(false);

  React.useEffect(() => {
    if (isLoading || isChecking.current) return;

    // Only redirect if user is authenticated, has a founder account, but hasn't completed onboarding
    if (user && founder && !founder.onboardingCompleted) {
      isChecking.current = true;
      router.replace("/onboarding");
    }
  }, [user, founder, isLoading, router]);

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
