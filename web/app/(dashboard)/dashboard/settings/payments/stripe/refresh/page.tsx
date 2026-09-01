"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/patterns/page-container";

export default function StripeRefreshPage() {
  const router = useRouter();

  useEffect(() => {
    // If the Stripe onboarding link expires, Stripe redirects here.
    // We just bounce the user back to the backend refresh endpoint,
    // which generates a fresh link and redirects them back to Stripe.
    const refreshStripeConnection = async () => {
      try {
        window.location.href = "/api/monetization/accounts/stripe/refresh";
      } catch (error) {
        console.error("Failed to refresh Stripe connection", error);
        router.replace("/dashboard/settings?tab=payments&stripe=error");
      }
    };

    refreshStripeConnection();
  }, [router]);

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Refreshing connection...</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Your onboarding link expired. We are generating a new one and redirecting you back to Stripe.
        </p>
      </div>
    </PageContainer>
  );
}
