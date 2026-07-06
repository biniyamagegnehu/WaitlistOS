"use client";

import { Suspense } from "react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { Spinner } from "@/components/ui/loader";
import PaymentPendingContent from "./pending-content";

export default function PaymentPendingPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Payment processing" description="Loading…">
          <div className="flex justify-center py-8">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        </AuthLayout>
      }
    >
      <PaymentPendingContent />
    </Suspense>
  );
}
