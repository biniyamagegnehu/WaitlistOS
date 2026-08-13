"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateShareUrl, getShareTarget, SHARE_PLATFORMS, type SharePlatform } from "@/lib/share";

const platforms = Object.keys(SHARE_PLATFORMS) as SharePlatform[];

interface SocialShareButtonsProps { waitlistSlug: string; referralCode?: string; title: string; onShare?: (platform: SharePlatform) => void; }

export function SocialShareButtons({ waitlistSlug, referralCode, title, onShare }: SocialShareButtonsProps) {
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const copyFallback = async (platform: SharePlatform, url: string) => {
    await navigator.clipboard?.writeText(url);
    setFallbackNotice(`${SHARE_PLATFORMS[platform].label} link copied. Paste it in the app to share.`);
  };

  const share = async (platform: SharePlatform) => {
    setFallbackNotice(null);
    const url = generateShareUrl({ waitlistSlug, referralCode, platform });
    onShare?.(platform);
    const target = getShareTarget(platform, url, title);
    if (target) {
      if (platform === "email") {
        window.location.href = target;
      } else if (!window.open(target, "_blank", "noopener,noreferrer")) {
        await copyFallback(platform, url);
      }
      return;
    }
    await copyFallback(platform, url);
  };
  return <div className="space-y-2"><div className="flex flex-wrap items-center gap-2">{platforms.map((platform) => {
    const label = SHARE_PLATFORMS[platform].label;
    return <Button key={platform} type="button" variant="secondary" className="h-11 w-11 rounded-full p-0 hover:-translate-y-0.5 hover:shadow-md" onClick={() => void share(platform)} aria-label={platform === "email" ? "Share via Email" : `Share on ${label}`} title={platform === "email" ? "Share via Email" : `Share on ${label}`}>
      <PlatformIcon platform={platform} />
    </Button>;
  })}</div>{fallbackNotice && <p className="text-xs text-muted-foreground" role="status">{fallbackNotice}</p>}</div>;
}

function PlatformIcon({ platform }: { platform: SharePlatform }) {
  const common = { className: "h-5 w-5", "aria-hidden": true };
  switch (platform) {
    case "twitter": return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.48 22H3.37l7.24-8.28L2.96 2h6.4l4.42 5.84L18.9 2Zm-1.1 18h1.72L8.43 3.9H6.59L17.8 20Z" /></svg>;
    case "whatsapp": return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M20.5 3.5A11.8 11.8 0 0 0 12.05 0C5.5 0 .17 5.32.17 11.88c0 2.1.55 4.15 1.6 5.95L.08 24l6.34-1.66a11.87 11.87 0 0 0 5.63 1.43h.01c6.55 0 11.88-5.33 11.88-11.89 0-3.17-1.24-6.14-3.44-8.38ZM12.05 21.77a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.76.99 1-3.66-.24-.38a9.89 9.89 0 1 1 8.41 4.64Zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.08-.3-.15-1.25-.46-2.38-1.48a8.94 8.94 0 0 1-1.65-2.05c-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.88.12.57-.08 1.76-.72 2-1.42.25-.7.25-1.3.18-1.42-.08-.12-.27-.2-.57-.35Z" /></svg>;
    case "facebook": return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M13.5 21v-8h2.75l.41-3.12H13.5V7.89c0-.9.25-1.51 1.55-1.51h1.66V3.59c-.29-.04-1.27-.12-2.41-.12-2.39 0-4.02 1.46-4.02 4.14v2.27H7.58V13h2.7v8h3.22Z" /></svg>;
    case "linkedin": return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M5.34 8.8H2.15V21h3.19V8.8ZM3.74 3.7A1.85 1.85 0 1 0 3.73 7.4a1.85 1.85 0 0 0 .01-3.7ZM21.85 13.99c0-3.68-1.97-5.39-4.6-5.39-2.12 0-3.07 1.17-3.6 1.99V8.8h-3.18V21h3.18v-6.04c0-1.59.3-3.13 2.27-3.13 1.94 0 1.97 1.82 1.97 3.23V21h3.19v-7.01h.77Z" /></svg>;
    case "telegram": return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M21.7 3.2 18.5 21c-.24 1.26-.91 1.57-1.84.98l-5.08-3.74-2.45 2.36c-.27.27-.5.5-1.02.5l.36-5.17 9.4-8.5c.41-.36-.09-.56-.64-.2L5.61 14.54.61 12.98c-1.09-.34-1.11-1.09.23-1.61L20.4 3.83c.91-.34 1.7.2 1.3 1.37Z" /></svg>;
    case "email": return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
    case "producthunt": return <svg viewBox="0 0 24 24" {...common}><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1.3 11.5H9.5V17H7V7h6.3a3.25 3.25 0 0 1 0 6.5Zm0-4H9.5v2h3.8a1 1 0 0 0 0-2Z" /></svg>;
  }
}
