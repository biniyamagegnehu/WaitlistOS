"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import JoinWaitlistForm from "../../../components/waitlist/JoinWaitlistForm";
import { getWaitlistBySlug } from "../../../services/api";
import { JoinResponse } from "../../../types/participant";
import { Waitlist } from "../../../types";

export default function PublicWaitlistPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [waitlist, setWaitlist] = useState<Waitlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joined, setJoined] = useState<JoinResponse | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

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
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-sm w-full">
          {/* Check icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-6">
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

          <h1 className="text-2xl font-bold mb-1">You joined {waitlist.name}!</h1>
          <p className="text-gray-500 text-sm mb-6">{joined.email}</p>

          <div className="border border-gray-200 rounded-xl py-6 px-8 inline-block">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
              Your Position
            </p>
            <p className="text-5xl font-extrabold text-black">#{joined.position}</p>
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
          Join the waitlist and secure your spot.
        </p>
        <JoinWaitlistForm
          waitlistSlug={slug}
          onSuccess={(data) => setJoined(data)}
        />
      </div>
    </div>
  );
}
