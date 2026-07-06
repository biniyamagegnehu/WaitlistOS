"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/loader";
import { useVerifyPayment } from "@/hooks/use-billing";
import { routes } from "@/lib/routes";

export default function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const txRef = searchParams.get("tx_ref") ?? searchParams.get("txRef");

  const { data, isLoading, isError } = useVerifyPayment(txRef);

  React.useEffect(() => {
    if (data?.success) {
      void queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
      void queryClient.invalidateQueries({ queryKey: ["billing", "history"] });
    }
  }, [data?.success, queryClient]);

  if (!txRef) {
    return (
      <AuthLayout title="Payment status" description="Missing transaction reference">
        <Alert variant="error">No transaction reference was provided.</Alert>
        <Button className="mt-6 w-full" onClick={() => router.push(routes.billing)}>
          Go to billing
        </Button>
      </AuthLayout>
    );
  }

  if (isLoading) {
    return (
      <AuthLayout
        title="Confirming payment"
        description="Please wait while we verify your payment"
      >
        <div className="flex flex-col items-center gap-4 py-8">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Verifying transaction…</p>
        </div>
      </AuthLayout>
    );
  }

  if (isError || !data?.success) {
    return (
      <AuthLayout
        title="Verification pending"
        description="We could not confirm your payment yet"
      >
        <Alert variant="warning">
          Your payment may still be processing. Check billing shortly or contact support if
          charges appear on your account.
        </Alert>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={() =>
              router.push(`${routes.paymentPending}?tx_ref=${encodeURIComponent(txRef)}`)
            }
          >
            Check status
          </Button>
          <Button variant="outline" onClick={() => router.push(routes.billing)}>
            Go to billing
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Payment successful" description="Your subscription is now active">
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <CheckCircle className="h-12 w-12 text-success" />
        <p className="text-sm text-muted-foreground">
          You are now on the <strong>{data.planCode}</strong> plan.
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <Button onClick={() => router.push(routes.dashboard)}>Go to dashboard</Button>
        <Link
          href={routes.billing}
          className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
        >
          View billing
        </Link>
      </div>
    </AuthLayout>
  );
}
