"use client";

import { Suspense } from "react";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import LoginCallbackContent from "./callback-content";

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Signing you in…" />}>
      <LoginCallbackContent />
    </Suspense>
  );
}
