"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import JoinWaitlistForm from "@/components/waitlist/JoinWaitlistForm";
import { getPublicWaitlistBySlug } from "@/services/api";
import { JoinResponse } from "@/types/participant";
import type { PublicWaitlistResponse } from "@/types/waitlist";

export default function PublicWaitlistPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const refCode = searchParams?.get("ref") ?? undefined;

  const [waitlistData, setWaitlistData] = useState<PublicWaitlistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joined, setJoined] = useState<JoinResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getPublicWaitlistBySlug(slug)
      .then((data) => {
        if (!data) setNotFound(true);
        else setWaitlistData(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopy = (link: string) => {
    const full = `${window.location.origin}${link}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (notFound || !waitlistData) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-2 text-white">Waitlist not found</h1>
        <p className="text-zinc-500 text-sm">
          The waitlist <strong>{slug}</strong> does not exist.
        </p>
      </div>
    );
  }

  const { waitlist, branding } = waitlistData;
  const primaryColor = branding?.primaryColor ?? "#6366F1";

  if (joined) {
    const fullReferralLink = `${typeof window !== "undefined" ? window.location.origin : ""}${joined.referralLink}`;

    return (
      <div className="text-center w-full space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mx-auto">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-1 text-white">You joined {waitlist.name}!</h1>
          <p className="text-zinc-500 text-sm">{joined.email}</p>
        </div>

        <div className="flex gap-4 justify-center">
          <div className="border border-white/10 bg-white/5 rounded-2xl py-6 px-8 flex-1">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Your Position</p>
            <p className="text-5xl font-extrabold text-white">#{joined.position}</p>
          </div>
          <div className="border border-white/10 bg-white/5 rounded-2xl py-6 px-8 flex-1">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Referrals</p>
            <p className="text-5xl font-extrabold text-white">{joined.referralCount}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Share to move up</p>
          <p className="text-sm text-zinc-300 break-all font-mono">{fullReferralLink}</p>
          <button
            onClick={() => handleCopy(joined.referralLink)}
            className="w-full mt-1 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            {copied ? "✓ Copied!" : "Copy Referral Link"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center w-full">
      {branding?.logoUrl && (
        <div className="flex justify-center mb-6">
          <Image
            src={branding.logoUrl}
            alt={`${waitlist.name} logo`}
            width={80}
            height={80}
            unoptimized
            className="h-20 w-20 rounded-2xl object-cover"
          />
        </div>
      )}

      <h1 className="text-3xl font-bold mb-2 text-white">{waitlist.name}</h1>
      <p className="text-zinc-400 mb-2">{waitlist.tagline}</p>
      {waitlist.description && (
        <p className="text-zinc-500 text-sm mb-8 max-w-md mx-auto">{waitlist.description}</p>
      )}
      {!waitlist.description && <div className="mb-8" />}

      <p className="text-zinc-500 text-sm mb-6">
        {refCode ? "You were referred! Join now to secure your spot." : "Join the waitlist and secure your spot."}
      </p>

      <JoinWaitlistForm
        waitlistSlug={slug}
        referralCode={refCode}
        onSuccess={(data) => setJoined(data)}
      />
    </div>
  );
}
