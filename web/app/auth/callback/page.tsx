"use client";

import { Suspense } from "react";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import AuthCallbackContent from "./callback-content";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Signing you in…" />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
