"use client";

import { Suspense } from "react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { LoadingState } from "@/components/patterns/loading-state";
import PaymentFailedContent from "./failed-content";

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Payment failed" description="Loading…">
          <LoadingState variant="inline" message="Loading..." />
        </AuthLayout>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}
