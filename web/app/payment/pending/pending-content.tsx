"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/loader";
import { useVerifyPayment } from "@/hooks/use-billing";
import { routes } from "@/lib/routes";

export default function PaymentPendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const txRef = searchParams.get("tx_ref") ?? searchParams.get("txRef");

  const { data, isLoading, isFetching, refetch } = useVerifyPayment(txRef);

  React.useEffect(() => {
    if (!txRef || !data) {
      return;
    }

    if (data.success) {
      void queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
      void queryClient.invalidateQueries({ queryKey: ["billing", "history"] });
      router.replace(`${routes.paymentSuccess}?tx_ref=${encodeURIComponent(txRef)}`);
      return;
    }

    if (data.status === "FAILED" || data.status === "CANCELLED") {
      router.replace(`${routes.paymentFailed}?tx_ref=${encodeURIComponent(txRef)}`);
    }
  }, [data, queryClient, router, txRef]);

  if (!txRef) {
    return (
      <AuthLayout title="Payment pending" description="Missing transaction reference">
        <Alert variant="warning">No transaction reference was provided.</Alert>
        <Button className="mt-6 w-full" onClick={() => router.push(routes.billing)}>
          Go to billing
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Payment processing"
      description="We are waiting for confirmation from the payment provider"
    >
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        {isLoading || isFetching ? (
          <Spinner className="h-10 w-10 text-primary" />
        ) : (
          <Clock className="h-12 w-12 text-warning" />
        )}
        <Alert variant="info">
          This usually takes a few seconds. You can refresh the status or return to billing.
        </Alert>
        <p className="font-mono text-xs text-muted-foreground">{txRef}</p>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <Button disabled={isFetching} onClick={() => void refetch()}>
          {isFetching ? "Checking…" : "Refresh status"}
        </Button>
        <Button variant="outline" onClick={() => router.push(routes.billing)}>
          Go to billing
        </Button>
      </div>
    </AuthLayout>
  );
}
