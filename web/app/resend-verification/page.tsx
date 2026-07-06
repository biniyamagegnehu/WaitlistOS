"use client";

import { Suspense } from "react";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import ResendVerificationContent from "./resend-verification-content";

export default function ResendVerificationPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResendVerificationContent />
    </Suspense>
  );
}
