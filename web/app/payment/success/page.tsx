"use client";

import { Suspense } from "react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { Spinner } from "@/components/ui/loader";
import PaymentSuccessContent from "./success-content";

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Confirming payment" description="Please wait…">
          <div className="flex justify-center py-8">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        </AuthLayout>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
