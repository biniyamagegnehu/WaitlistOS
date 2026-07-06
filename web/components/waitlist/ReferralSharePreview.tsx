"use client";

import { useMemo, useState } from "react";
import { getAppUrl, getReferralOgImageUrl } from "@/lib/og";

interface ReferralSharePreviewProps {
  referralCode: string;
  productName: string;
}

export function ReferralSharePreview({
  referralCode,
  productName,
}: ReferralSharePreviewProps) {
  const [hasError, setHasError] = useState(false);

  const imageUrl = useMemo(() => {
    const base =
      typeof window !== "undefined" ? window.location.origin : getAppUrl();
    const path = getReferralOgImageUrl(referralCode, base);
    return `${path}?v=${encodeURIComponent(referralCode)}`;
  }, [referralCode]);

  if (hasError) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        Preview unavailable right now. Your share link still includes the dynamic
        social image.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={`Share preview for ${productName}`}
        width={600}
        height={315}
        className="h-auto w-full"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
