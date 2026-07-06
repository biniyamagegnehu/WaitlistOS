"use client";

import { Suspense } from "react";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import VerifyEmailContent from "./verify-email-content";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading verification…" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
