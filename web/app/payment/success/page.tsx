"use client";

import { Suspense } from "react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { LoadingState } from "@/components/patterns/loading-state";
import PaymentSuccessContent from "./success-content";

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Confirming payment" description="Please wait…">
          <LoadingState variant="inline" message="Confirming payment..." />
        </AuthLayout>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
