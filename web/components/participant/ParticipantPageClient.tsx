"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { getParticipantByToken } from "@/services/participants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/loader";
import { ReferralSharePreview } from "@/components/waitlist/ReferralSharePreview";
import { getShareableReferralUrl } from "@/lib/referral";
import { ReferralMessages } from "@/components/waitlist/ReferralMessages";
import { TeamSection } from "@/components/waitlist/TeamSection";
import { SocialShareButtons } from "@/components/waitlist/SocialShareButtons";
import { SkipLineCard } from "@/components/waitlist/SkipLineCard";
import { PreOrderDepositCard } from "@/components/waitlist/PreOrderDepositCard";

interface ParticipantPageClientProps {
  slug: string;
  token: string;
}

export default function ParticipantPageClient({ slug, token }: ParticipantPageClientProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getParticipantByToken(slug, token);
        if (!result) {
          setError("Invalid or expired link. Please request a new one.");
        } else {
          setData(result.data);
          
          // Apply theme mode
          const mode = result.data.waitlist?.themeMode ?? "SYSTEM";
          if (mode === "DARK") {
            document.documentElement.classList.add("dark");
          } else if (mode === "LIGHT") {
            document.documentElement.classList.remove("dark");
          } else {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            document.documentElement.classList.toggle("dark", prefersDark);
          }
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError("This link has been revoked.");
        } else {
          setError("An error occurred. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, token]);

  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-5 w-5 text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  const { participant, waitlist, branding } = data;
  const primaryColor = branding?.primaryColor ?? "var(--primary)";
  const fullReferralLink = getShareableReferralUrl(participant.referralCode, typeof window !== 'undefined' ? window.location.origin : '');

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-16 pt-8">
      <div className="text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>

        <div>
          <h1 className="mb-1 text-2xl font-semibold text-foreground">
            Your Waitlist Page
          </h1>
          <p className="text-sm text-muted-foreground">Welcome back to {waitlist.name}</p>
        </div>

        <div className="flex gap-4">
          <Card className="flex-1">
            <CardContent className="py-6 text-center">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your Position
              </p>
              <p className="text-4xl font-semibold text-foreground">#{participant.position}</p>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="py-6 text-center">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Referrals
              </p>
              <p className="text-4xl font-semibold text-foreground">{participant.referralCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Skip the Line Card */}
        {waitlist.skipLineEnabled && (
          <SkipLineCard
            participantId={participant.id}
            waitlistId={waitlist.id}
            current_position={participant.position}
            hasPriority={false}
          />
        )}
        
        {/* Pre-Order Deposit Card */}
        {waitlist.preOrderDepositEnabled && (
          <PreOrderDepositCard
            participantId={participant.id}
            waitlistId={waitlist.id}
          />
        )}

        <Card>
          <CardContent className="space-y-3 p-5 text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Share preview
            </p>
            <ReferralSharePreview
              referralCode={participant.referralCode}
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
                {waitlist.rewards.map((reward: any) => {
                  const isUnlocked = participant.referralCount >= reward.milestone;
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
                const unachieved = waitlist.rewards.filter((r: any) => r.milestone > participant.referralCount);
                const nextTarget = unachieved.length > 0 ? unachieved[0].milestone : waitlist.rewards[waitlist.rewards.length - 1].milestone;
                const percent = Math.min(Math.round((participant.referralCount / nextTarget) * 100), 100);
                
                return (
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress to next reward</span>
                      <span className="font-medium text-foreground">{participant.referralCount} / {nextTarget}</span>
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

        {waitlist.streakBonusesEnabled && participant.streak && (
          <Card>
            <CardContent className="space-y-4 p-5 text-left">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Streak Bonuses
                </p>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <span className="text-xl">🔥</span>
                  <span className={participant.streak.active ? "text-orange-500" : "text-muted-foreground"}>
                    {participant.streak.current} Day{participant.streak.current !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {waitlist.streakMilestones && waitlist.streakMilestones.length > 0 && (
                <div className="space-y-3 mt-4">
                  <p className="text-xs font-medium text-muted-foreground">Milestones</p>
                  {waitlist.streakMilestones.map((milestone: any) => {
                    const isUnlocked = participant.unlockedStreakRewards?.some((r: any) => r.days === milestone.days);
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
            participantId={participant.id}
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
              referralCode={participant.referralCode}
              title={`Join ${waitlist.name}`}
              onShare={() => {}}
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
        <ReferralMessages participantId={participant.id} primaryColor={primaryColor} />
      </div>
    </div>
  );
}
