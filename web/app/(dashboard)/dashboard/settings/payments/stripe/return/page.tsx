"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";

export default function StripeReturnPage() {
  const router = useRouter();

  useEffect(() => {
    // Call the backend return endpoint to check the Stripe account status
    // The backend will update the database and return a status
    const finalizeStripeConnection = async () => {
      try {
        // We use window.location here because the backend return endpoint
        // actually does a 302 redirect back to the settings page with the status.
        // We could just link directly to the backend endpoint, but having this
        // loading page makes the UX smoother for the user so they see a spinner.
        window.location.href = "/api/monetization/accounts/stripe/return";
      } catch (error) {
        console.error("Failed to finalize Stripe connection", error);
        router.replace("/dashboard/settings?tab=payments&stripe=error");
      }
    };

    finalizeStripeConnection();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <h2 className="text-xl font-semibold">Finalizing your Stripe connection...</h2>
      <p className="text-muted-foreground text-center max-w-sm">
        Please wait while we verify your account status with Stripe. This will only take a moment.
      </p>
    </div>
  );
}
