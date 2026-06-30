"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import JoinWaitlistForm from "../../../components/waitlist/JoinWaitlistForm";
import { getWaitlistBySlug } from "../../../services/api";
import { JoinResponse } from "../../../types/participant";
import { Waitlist } from "../../../types";

export default function PublicWaitlistPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const refCode = searchParams?.get("ref") ?? undefined;

  const [waitlist, setWaitlist] = useState<Waitlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joined, setJoined] = useState<JoinResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getWaitlistBySlug(slug)
      .then((data) => {
        if (!data) setNotFound(true);
        else setWaitlist(data);
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

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  // ── Not Found ─────────────────────────────────────────────
  if (notFound || !waitlist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Waitlist not found</h1>
          <p className="text-gray-500 text-sm">
            The waitlist <strong>{slug}</strong> does not exist.
          </p>
        </div>
      </div>
    );
  }

  // ── Success State ─────────────────────────────────────────
  if (joined) {
    const fullReferralLink = `${typeof window !== "undefined" ? window.location.origin : ""}${joined.referralLink}`;

    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-sm w-full space-y-6">
          {/* Check icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-1">You joined {waitlist.name}!</h1>
            <p className="text-gray-500 text-sm">{joined.email}</p>
          </div>

          {/* Position */}
          {/* Position & Referrals */}
          <div className="flex gap-4 justify-center">
            <div className="border border-gray-200 rounded-xl py-6 px-8 flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                Your Position
              </p>
              <p className="text-5xl font-extrabold text-black">#{joined.position}</p>
            </div>
            <div className="border border-gray-200 rounded-xl py-6 px-8 flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                Referrals
              </p>
              <p className="text-5xl font-extrabold text-black">{joined.referralCount}</p>
            </div>
          </div>

          {/* Referral link */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Share to move up the list
            </p>
            <p className="text-sm text-gray-700 break-all font-mono">{fullReferralLink}</p>
            <button
              onClick={() => handleCopy(joined.referralLink)}
              className="w-full mt-1 bg-black text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              {copied ? "✓ Copied!" : "Copy Referral Link"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Join Form State ───────────────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2">{waitlist.name}</h1>
        <p className="text-gray-500 mb-8">
          {refCode
            ? "You were referred! Join now to secure your spot."
            : "Join the waitlist and secure your spot."}
        </p>
        <JoinWaitlistForm
          waitlistSlug={slug}
          referralCode={refCode}
          onSuccess={(data) => setJoined(data)}
        />
      </div>
    </div>
  );
}
