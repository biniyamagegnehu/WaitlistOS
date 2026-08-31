"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Users, Trophy, TrendingUp } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import MultiStepSignupForm from "@/components/waitlist/MultiStepSignupForm";
import { getPublicWaitlistBySlug } from "@/services/api";
import { JoinResponse } from "@/types/participant";
import type { PublicWaitlistResponse, TeamLeaderboardEntry } from "@/types/waitlist";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/loader";
import { UrgencyWidget } from "@/components/public/UrgencyWidget";
import { trackFunnelEvent } from "./AnalyticsTracker";
import { WaitlistPageRenderer } from "./WaitlistPageRenderer";


export default function PublicWaitlistPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const refCode = searchParams?.get("ref") ?? undefined;

  const [waitlistData, setWaitlistData] = useState<PublicWaitlistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joined, setJoined] = useState<JoinResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const referralSharedTracked = useRef(false);

  useEffect(() => {
    if (!slug) return;
    
    const fetchData = () => {
      getPublicWaitlistBySlug(slug)
        .then((data) => {
          if (!data) setNotFound(true);
          else {
            setWaitlistData(data);
            // Apply the founder-configured theme
            // (the server script handles initial load; this handles SPA navigation / polls)
            const mode = data.waitlist?.themeMode ?? "SYSTEM";
            if (mode === "DARK") {
              document.documentElement.classList.add("dark");
            } else if (mode === "LIGHT") {
              document.documentElement.classList.remove("dark");
            } else {
              const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              document.documentElement.classList.toggle("dark", prefersDark);
            }
          }
        })
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false));
    };

    fetchData();
    
    // Poll for real-time updates every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [slug]);

  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Track REFERRAL_SHARED funnel event (once per session)
      if (!referralSharedTracked.current && joined && waitlistData) {
        referralSharedTracked.current = true;
        const sessionId = getCookie("waitlist_session");
        if (sessionId) {
          trackFunnelEvent(waitlistData.waitlist.id, sessionId, "REFERRAL_SHARED");
        }
      }
    });
  };

  const trackReferralShare = () => {
    if (!referralSharedTracked.current && joined && waitlistData) {
      referralSharedTracked.current = true;
      const sessionId = getCookie("waitlist_session");
      if (sessionId) trackFunnelEvent(waitlistData.waitlist.id, sessionId, "REFERRAL_SHARED");
    }
  };

  const getCookie = (name: string): string | undefined => {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split("=")[1]) : undefined;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-5 w-5 text-primary" />
      </div>
    );
  }

  if (notFound || !waitlistData) {
    return (
      <div className="py-20 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Waitlist not found</h1>
        <p className="text-sm text-muted-foreground">
          The waitlist <strong className="text-foreground">{slug}</strong> does not exist.
        </p>
      </div>
    );
  }

  const { waitlist, branding, copy } = waitlistData;
  const primaryColor = branding?.primaryColor ?? "var(--primary)";
  const isBuilderActive = !!waitlistData.pageConfig;

  if (joined) {
    // Email verification is always required — show the improved "Check your email" page
    return (
      <div className="w-full max-w-md mx-auto">
        {/* Animated envelope icon */}
        <div className="flex flex-col items-center text-center space-y-5">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            {/* Outer pulse ring */}
            <span className="absolute inset-0 animate-ping rounded-full opacity-20 bg-primary" />
            <svg
              className="h-12 w-12 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.4}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.023.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Check your inbox
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              We sent a verification link to{" "}
              <span className="font-semibold text-foreground">{joined.email}</span>.
              Click it to access your personal waitlist page.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="mt-8 space-y-3">
          {[
            {
              step: "1",
              title: "Open the email we sent you",
              detail: `Subject: "Confirm your email and access ${waitlist.name}"`,
              done: false,
            },
            {
              step: "2",
              title: "Click \"Verify Email & View My Spot\"",
              detail: "You'll be taken directly to your personal waitlist dashboard.",
              done: false,
            },
            {
              step: "3",
              title: "Bookmark your personal link",
              detail: "Your link is permanent — return anytime, no password needed.",
              done: false,
            },
          ].map(({ step, title, detail }) => (
            <div
              key={step}
              className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 text-left"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-primary text-primary-foreground">
                {step}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Didn't receive it nudge */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Didn&apos;t get it? Check your spam folder.
        </p>

        {/* Security note */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-surface-muted/60 p-3 text-left">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <p className="text-xs text-muted-foreground">
            Your personal link is a secure bearer credential. Keep it private — anyone with it can view your waitlist status.
          </p>
        </div>
      </div>
    );
  }


  if (isBuilderActive) {
    return (
      <WaitlistPageRenderer
        config={waitlistData.pageConfig!}
        waitlistData={waitlistData}
        refCode={refCode}
        onJoin={setJoined}
      />
    );
  }

  // Render original default logic
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-16">
      {/* Section 1: Hero Card */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-8 text-center space-y-6">
          {branding?.logoUrl && (
            <div className="flex justify-center">
              <Image
                src={branding.logoUrl}
                alt={`${waitlist.name} logo`}
                width={80}
                height={80}
                unoptimized
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
            </div>
          )}
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">{waitlist.name}</h1>
            <p className="text-lg font-medium text-muted-foreground">{waitlist.tagline}</p>
          </div>
          {waitlist.description && (
            <p className="mx-auto max-w-xl text-sm text-muted-foreground leading-relaxed">
              {waitlist.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Marketing Content */}
      {copy && (
        <div className="text-center space-y-6 py-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{copy.headline}</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{copy.subheadline}</p>
          <Button 
            size="lg" 
            className="mt-4 rounded-full px-8 font-semibold shadow-sm hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
            onClick={() => document.getElementById("join-form")?.scrollIntoView({ behavior: "smooth" })}
          >
            {copy.cta}
          </Button>
        </div>
      )}

      {/* Section 3: Features */}
      {copy?.features && copy.features.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-3 py-8">
          {copy.features.map((feature, idx) => (
            <Card key={idx} className="bg-surface shadow-sm border-border/50">
              <CardContent className="p-6 space-y-3 text-center sm:text-left">
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Section 4: FAQs */}
      {copy?.faqs && copy.faqs.length > 0 && (
        <div className="py-8 space-y-6">
          <h3 className="text-2xl font-bold tracking-tight text-center mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {copy.faqs.map((faq, idx) => (
              <details key={idx} className="group rounded-lg border border-border bg-surface p-4 shadow-sm transition-all [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground">
                  {faq.question}
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Section 4.5: Urgency Engine */}
      <UrgencyWidget
        urgencyEnabled={waitlist.urgencyEnabled}
        batchEnabled={waitlist.batchEnabled}
        batchName={waitlist.batchName}
        batchSize={waitlist.batchSize}
        batchDescription={waitlist.batchDescription}
        countdownEnabled={waitlist.countdownEnabled}
        launchDate={waitlist.launchDate}
        showRemainingSpots={waitlist.showRemainingSpots}
        showBatchProgress={waitlist.showBatchProgress}
        showCountdown={waitlist.showCountdown}
        currentParticipants={waitlist.participantCount || 0}
        batchUrgency={waitlist.batchUrgency}
      />

      {/* Section 5: Join Waitlist Form */}
      <Card id="join-form" className="shadow-sm border-border/50">
        <CardContent className="p-8 text-center space-y-6">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Join the Waitlist</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {refCode
                ? "You were referred! Join now to secure your spot."
                : "Enter your email to secure your spot in line."}
            </p>
          </div>
          <MultiStepSignupForm
            waitlistSlug={slug}
            waitlistId={waitlist.id}
            referralCode={refCode}
            signupConfig={waitlistData?.signupConfig}
            onSuccess={(data) => setJoined(data)}
          />
        </CardContent>
      </Card>

      {/* Section 6: Leaderboard (Individual + Team) */}
      <LeaderboardSection
        waitlistId={waitlist.id}
        teamLeaderboard={waitlistData?.teamLeaderboard}
        teamReferralsEnabled={waitlist.teamReferralsEnabled ?? false}
      />
    </div>
  );
}

export function LeaderboardSection({
  waitlistId: _waitlistId,
  teamLeaderboard,
  teamReferralsEnabled,
}: {
  waitlistId: string;
  teamLeaderboard?: TeamLeaderboardEntry[];
  teamReferralsEnabled: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"individual" | "team">("individual");

  if (!teamReferralsEnabled || !teamLeaderboard || teamLeaderboard.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm border-border/50">
      <CardContent className="p-6 space-y-5">
        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
          <button
            onClick={() => setActiveTab("individual")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "individual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Individual Rankings
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "team"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Team Rankings
          </button>
        </div>

        {activeTab === "team" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Team Leaderboard</h3>
            </div>
            {teamLeaderboard.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-border bg-surface"
              >
                {/* Rank */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  {team.rank <= 3 ? (
                    <span className="text-sm">
                      {team.rank === 1 ? "🥇" : team.rank === 2 ? "🥈" : "🥉"}
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">#{team.rank}</span>
                  )}
                </div>

                {/* Team info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{team.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Users className="h-3 w-3" />
                    <span>{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-bold text-foreground">{team.totalReferrals}</span>
                  <span className="text-xs text-muted-foreground">referrals</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "individual" && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p>Sign up and refer friends to see your ranking.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
