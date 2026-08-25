"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { CheckCircle, Users, Trophy, TrendingUp, Zap } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import MultiStepSignupForm from "@/components/waitlist/MultiStepSignupForm";
import { getPublicWaitlistBySlug } from "@/services/api";
import { JoinResponse } from "@/types/participant";
import type { PublicWaitlistResponse, TeamLeaderboardEntry } from "@/types/waitlist";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/loader";
import { ReferralSharePreview } from "@/components/waitlist/ReferralSharePreview";
import { getShareableReferralUrl } from "@/lib/referral";
import { ReferralMessages } from "@/components/waitlist/ReferralMessages";
import { TeamSection } from "@/components/waitlist/TeamSection";
import { UrgencyWidget } from "@/components/public/UrgencyWidget";
import { trackFunnelEvent } from "./AnalyticsTracker";
import { WaitlistPageRenderer } from "./WaitlistPageRenderer";
import { SocialShareButtons } from "@/components/waitlist/SocialShareButtons";
import { SkipLineCard } from "@/components/waitlist/SkipLineCard";
import { PreOrderDepositCard } from "@/components/waitlist/PreOrderDepositCard";

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
    const fullReferralLink = getShareableReferralUrl(joined.referralCode, window.location.origin);

    return (
      <div className="w-full space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>

        <div>
          <h1 className="mb-1 text-2xl font-semibold text-foreground">
            You joined {waitlist.name}!
          </h1>
          <p className="text-sm text-muted-foreground">{joined.email}</p>
        </div>

        <div className="flex gap-4">
          <Card className="flex-1">
            <CardContent className="py-6 text-center">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your Position
              </p>
              <p className="text-4xl font-semibold text-foreground">#{joined.position}</p>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="py-6 text-center">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Referrals
              </p>
              <p className="text-4xl font-semibold text-foreground">{joined.referralCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Skip the Line Card */}
        <SkipLineCard
          participantId={joined.id}
          waitlistId={waitlist.id}
          current_position={joined.position}
          hasPriority={false}
        />
        
        {/* Pre-Order Deposit Card */}
        <PreOrderDepositCard
          participantId={joined.id}
          waitlistId={waitlist.id}
        />

        <Card>
          <CardContent className="space-y-3 p-5 text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Share preview
            </p>
            <ReferralSharePreview
              referralCode={joined.referralCode}
              productName={waitlist.name}
            />
          </CardContent>
        </Card>

        {waitlist.rewards && waitlist.rewards.length > 0 && (
          <Card>
            <CardContent className="space-y-4 p-5 text-left">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Rewards
              </p>
              
              <div className="space-y-3">
                {waitlist.rewards.map(reward => {
                  const isUnlocked = joined.referralCount >= reward.milestone;
                  return (
                    <div key={reward.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface">
                      <div className="mt-0.5">
                        <CheckCircle className={`h-5 w-5 ${isUnlocked ? 'text-success' : 'text-muted-foreground/30'}`} />
                      </div>
                      <div>
                        <p className={`font-medium ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {reward.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Refer {reward.milestone} people
                        </p>
                        {reward.description && (
                          <p className="mt-1 text-sm text-muted-foreground/80">{reward.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const unachieved = waitlist.rewards.filter(r => r.milestone > joined.referralCount);
                const nextTarget = unachieved.length > 0 ? unachieved[0].milestone : waitlist.rewards[waitlist.rewards.length - 1].milestone;
                const percent = Math.min(Math.round((joined.referralCount / nextTarget) * 100), 100);
                
                return (
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress to next reward</span>
                      <span className="font-medium text-foreground">{joined.referralCount} / {nextTarget}</span>
                    </div>
                    <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: primaryColor }}
                      />
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {waitlist.streakBonusesEnabled && joined.streak && (
          <Card>
            <CardContent className="space-y-4 p-5 text-left">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Streak Bonuses
                </p>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <span className="text-xl">🔥</span>
                  <span className={joined.streak.active ? "text-orange-500" : "text-muted-foreground"}>
                    {joined.streak.current} Day{joined.streak.current !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {joined.streak.referredToday ? (
                <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success-foreground flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                  <p>You've referred someone today! Keep it up tomorrow to maintain your streak.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-warning-foreground">
                  <p>⚠️ Refer one friend today to {joined.streak.active ? 'keep your streak alive' : 'start your streak'}!</p>
                </div>
              )}

              {waitlist.streakMilestones && waitlist.streakMilestones.length > 0 && (
                <div className="space-y-3 mt-4">
                  <p className="text-xs font-medium text-muted-foreground">Milestones</p>
                  {waitlist.streakMilestones.map(milestone => {
                    const isUnlocked = joined.streak!.unlockedRewards?.some(r => r.days === milestone.days);
                    return (
                      <div key={milestone.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface">
                        <div className="mt-0.5">
                          <CheckCircle className={`h-5 w-5 ${isUnlocked ? 'text-success' : 'text-muted-foreground/30'}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {milestone.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {milestone.days} Day Streak
                          </p>
                          {milestone.description && (
                            <p className="mt-1 text-sm text-muted-foreground/80">{milestone.description}</p>
                          )}
                        </div>
                        <div className="ml-auto text-right">
                           <Badge variant="info">+{milestone.value} Boost</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {waitlist.teamReferralsEnabled && (
          <TeamSection
            participantId={joined.id}
            waitlistId={waitlist.id}
            primaryColor={primaryColor}
          />
        )}

        <Card>
          <CardContent className="space-y-3 p-5 text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Share to move up
            </p>
            <p className="break-all font-mono text-sm text-foreground">{fullReferralLink}</p>
            <SocialShareButtons
              waitlistSlug={waitlist.slug}
              referralCode={joined.referralCode}
              title={`Join ${waitlist.name}`}
              onShare={trackReferralShare}
            />
            <Button
              onClick={() => handleCopy(fullReferralLink)}
              className="w-full"
              style={{ backgroundColor: primaryColor }}
            >
              {copied ? "Copied!" : "Copy referral link"}
            </Button>
          </CardContent>
        </Card>

        {/* AI Referral Messages */}
        <ReferralMessages participantId={joined.id} primaryColor={primaryColor} />
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
