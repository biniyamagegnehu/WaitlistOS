import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AttributionResolver } from './lib/attribution-resolver';

// Middleware applies only to public waitlist paths (e.g. /w/:slug)
export const config = {
  matcher: ['/w/:slug'],
};

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const response = NextResponse.next();

  // ── Session ID ─────────────────────────────────────────────────────
  let sessionId = request.cookies.get('waitlist_session')?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    response.cookies.set('waitlist_session', sessionId, {
      path: '/',
      // Must be false so AnalyticsTracker.tsx can read it via document.cookie
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  // ── Attribution (first-touch only) ─────────────────────────────────
  const existingAttribution = request.cookies.get('waitlist_attribution')?.value;

  // Don't overwrite an existing attribution cookie (first-touch model)
  if (!existingAttribution) {
    const utmSource = url.searchParams.get('utm_source');
    const utmMedium = url.searchParams.get('utm_medium');
    const utmCampaign = url.searchParams.get('utm_campaign');
    const referrer = request.headers.get('referer');

    const resolved = AttributionResolver.resolve({
      utmSource,
      utmMedium,
      utmCampaign,
      referrer,
    });

    // Always set the attribution cookie — even for DIRECT — so the tracker
    // always has a source value to send and the backend never receives UNKNOWN
    // for a session that simply arrived directly.
    response.cookies.set(
      'waitlist_attribution',
      JSON.stringify({
        source: resolved.source,
        medium: resolved.medium ?? null,
        campaign: resolved.campaign ?? null,
        referrer: resolved.referrer ?? null,
        timestamp: new Date().toISOString(),
      }),
      {
        path: '/',
        // Must be false so JoinWaitlistForm.tsx can also read this cookie
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      },
    );
  }

  return response;
}
