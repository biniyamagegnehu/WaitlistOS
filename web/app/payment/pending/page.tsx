"use client";

import { Suspense } from "react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { LoadingState } from "@/components/patterns/loading-state";
import PaymentPendingContent from "./pending-content";

export default function PaymentPendingPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Payment processing" description="Loading…">
          <LoadingState variant="inline" message="Loading..." />
        </AuthLayout>
      }
    >
      <PaymentPendingContent />
    </Suspense>
  );
}
