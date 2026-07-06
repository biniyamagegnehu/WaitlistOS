"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { routes } from "@/lib/routes";

export default function PaymentFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref") ?? searchParams.get("txRef");

  return (
    <AuthLayout title="Payment failed" description="Your subscription was not activated">
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <XCircle className="h-12 w-12 text-destructive" />
        <Alert variant="error">
          The payment could not be completed. No charges were applied to your subscription.
        </Alert>
        {txRef && (
          <p className="font-mono text-xs text-muted-foreground">Reference: {txRef}</p>
        )}
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <Button onClick={() => router.push(routes.pricing)}>Try again</Button>
        <Button variant="outline" onClick={() => router.push(routes.billing)}>
          Go to billing
        </Button>
      </div>
    </AuthLayout>
  );
}
