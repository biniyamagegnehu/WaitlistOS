"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";

/** Read a document cookie by name (only works for non-httpOnly cookies). */
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : undefined;
}

// Must match the pattern in web/lib/axios.ts: `${API_URL}/api`
const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3000") + "/api";

export function AnalyticsTracker() {
  const params = useParams();
  const slug = params?.slug as string;
  const tracked = useRef(false);

  useEffect(() => {
    if (!slug || tracked.current) return;
    tracked.current = true;

    // ── Session ID ────────────────────────────────────────────────────
    // The middleware sets this as a non-httpOnly cookie.
    // If it is somehow missing (e.g. middleware didn't run), generate one
    // client-side so we never skip the visit ping entirely.
    let sessionId = getCookie("waitlist_session");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      // Store it for the current page-session duration
      document.cookie = `waitlist_session=${sessionId}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    }

    // ── Attribution ───────────────────────────────────────────────────
    let source = "DIRECT";
    let medium: string | undefined;
    let campaign: string | undefined;

    const attributionRaw = getCookie("waitlist_attribution");
    if (attributionRaw) {
      try {
        const attribution = JSON.parse(attributionRaw);
        source = attribution.source || "DIRECT";
        medium = attribution.medium ?? undefined;
        campaign = attribution.campaign ?? undefined;
      } catch {
        // malformed cookie — default to DIRECT
      }
    }

    // ── Ping backend ─────────────────────────────────────────────────
    fetch(`${API_BASE}/w/${slug}/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, source, medium, campaign }),
    }).catch(() => {
      // Fail silently — analytics must never break UX
    });
  }, [slug]);

  return null;
}
