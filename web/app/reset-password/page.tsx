"use client";

import { Suspense } from "react";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import ResetPasswordContent from "./reset-password-content";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
