"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { affiliateService } from "@/services/affiliates";

export function AffiliateTracker() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  const trackedRef = useRef(false);

  useEffect(() => {
    if (refCode && !trackedRef.current) {
      trackedRef.current = true;
      affiliateService.trackClick(refCode).catch((err) => {
        console.error("Failed to track affiliate click:", err);
      });
    }
  }, [refCode]);

  return null;
}
