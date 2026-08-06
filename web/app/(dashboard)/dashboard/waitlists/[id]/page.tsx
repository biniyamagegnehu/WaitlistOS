"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Share2, ChevronDown, ChevronUp, Activity, AlertTriangle } from "lucide-react";
import { ParticipantTable } from "@/components/dashboard/ParticipantTable";
import { AiCopywriter } from "@/components/dashboard/AiCopywriter";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDashboardWaitlistDetail, updateWaitlist } from "@/services/dashboard";
import type { DashboardWaitlistDetail, DashboardParticipant, DashboardWaitlist, PaginationMetadata } from "@/types/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { StreakBonusesCard } from "@/components/dashboard/StreakBonusesCard";
import { TeamReferralsCard } from "@/components/dashboard/TeamReferralsCard";
export default function WaitlistDetailPage() {
  const params = useParams();
  const waitlistId = params?.id as string;

  const [detail, setDetail] = React.useState<DashboardWaitlistDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(true);

  const loadPage = React.useCallback(async (options: {
    page: number;
    pageSize: number;
    search?: string;
    sortBy?: 'position' | 'referralCount' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    status?: 'WAITING' | 'INVITED' | 'ACCESSED';
  }) => {
    const result = await getDashboardWaitlistDetail(waitlistId, options);
    return {
      participants: result.participants,
      pagination: result.pagination,
    };
  }, [waitlistId]);

  React.useEffect(() => {
    if (!waitlistId) return;

    getDashboardWaitlistDetail(waitlistId)
      .then(setDetail)
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Failed to load waitlist"));
      })
      .finally(() => setIsLoading(false));
  }, [waitlistId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-10 w-72" />
        <Skeleton variant="rectangular" className="h-64" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <EmptyState
        title="Waitlist not found"
        description={error ?? "This waitlist could not be loaded."}
        action={
          <Link href={routes.waitlists}>
            <Button variant="secondary">Back to waitlists</Button>
          </Link>
        }
      />
    );
  }

  const { waitlist, participants, pagination } = detail;

  return (
    <div className="space-y-6">
      <Link
        href={routes.waitlists}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to waitlists
      </Link>

      <SectionHeader
        title={waitlist.name}
        description={`/${waitlist.slug}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">
              {waitlist.totalParticipants}{" "}
              {waitlist.totalParticipants === 1 ? "signup" : "signups"}
            </Badge>
            <Link href={routes.waitlistShare(waitlist.id)}>
              <Button variant="secondary" size="sm" leftIcon={<Share2 className="h-3.5 w-3.5" />}>
                Share
              </Button>
            </Link>
            <Link
              href={routes.waitlistPublic(waitlist.slug)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="sm" leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                View page
              </Button>
            </Link>
            <ExportButton waitlistId={waitlist.id} />
          </div>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Waitlist Information</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-base text-foreground">{waitlist.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tagline</p>
                  <p className="text-base text-foreground">{waitlist.tagline}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Slug</p>
                  <p className="text-base text-foreground">/{waitlist.slug}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Signups</p>
                  <p className="text-base text-foreground">{waitlist.totalParticipants}</p>
                </div>
              </div>

              {waitlist.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-base text-foreground">{waitlist.description}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Link href={routes.waitlistEdit(waitlist.id)} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Edit Waitlist
                  </Button>
                </Link>
                <Link href={routes.waitlistRewards(waitlist.id)} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Rewards
                  </Button>
                </Link>
                <Link href={routes.waitlistOpenGates(waitlist.id)} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Open Gates
                  </Button>
                </Link>
                <Link href={routes.waitlistShare(waitlist.id)} className="flex-1">
                  <Button className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DoubleSidedRewardsCard waitlistId={waitlistId} initialData={waitlist} />
      <StreakBonusesCard waitlistId={waitlistId} initialData={waitlist} />
      <TeamReferralsCard waitlistId={waitlistId} initialData={waitlist} />

      <AiCopywriter waitlistId={waitlistId} waitlist={waitlist} />

      {/* Waitlist Health Card */}
      {detail.health && (
        <WaitlistHealthCard health={detail.health} total={waitlist.totalParticipants} />
      )}

      <ParticipantTable
        waitlistId={waitlistId}
        initialParticipants={participants}
        initialPagination={pagination}
        onLoadPage={loadPage}
      />
    </div>
  );
}

function WaitlistHealthCard({
  health,
  total,
}: {
  health: { healthy: number; mediumRisk: number; highRisk: number; notEvaluated: number };
  total: number;
}) {
  const atRisk = health.mediumRisk + health.highRisk;
  const healthyPct = total > 0 ? Math.round((health.healthy / total) * 100) : 0;
  const mediumPct = total > 0 ? Math.round((health.mediumRisk / total) * 100) : 0;
  const highPct = total > 0 ? Math.round((health.highRisk / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Engagement Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Progress bar */}
        {total > 0 && (
          <div className="space-y-2">
            <div className="flex h-3 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="bg-success transition-all"
                style={{ width: `${healthyPct}%` }}
                title={`Healthy: ${healthyPct}%`}
              />
              <div
                className="bg-warning transition-all"
                style={{ width: `${mediumPct}%` }}
                title={`Medium Risk: ${mediumPct}%`}
              />
              <div
                className="bg-destructive transition-all"
                style={{ width: `${highPct}%` }}
                title={`High Risk: ${highPct}%`}
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-success" />
                Healthy {healthyPct}%
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-warning" />
                Medium {mediumPct}%
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
                High Risk {highPct}%
              </span>
            </div>
          </div>
        )}

        {/* Stat grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <HealthStat
            label="Healthy"
            value={health.healthy}
            color="text-success"
            dot="bg-success"
          />
          <HealthStat
            label="Medium Risk"
            value={health.mediumRisk}
            color="text-warning"
            dot="bg-warning"
          />
          <HealthStat
            label="High Risk"
            value={health.highRisk}
            color="text-destructive"
            dot="bg-destructive"
          />
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              <p className="text-xs font-medium text-muted-foreground">At Risk</p>
            </div>
            <p className={`text-2xl font-bold ${atRisk > 0 ? 'text-warning' : 'text-foreground'}`}>
              {atRisk}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {atRisk > 0 ? 'need re-engagement' : 'all good!'}
            </p>
          </div>
        </div>

        {atRisk > 0 && (
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            Re-engagement emails are automatically queued for high-risk participants once per week.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function HealthStat({
  label,
  value,
  color,
  dot,
}: {
  label: string;
  value: number;
  color: string;
  dot: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function DoubleSidedRewardsCard({
  waitlistId,
  initialData,
}: {
  waitlistId: string;
  initialData: DashboardWaitlist;
}) {
  const [enabled, setEnabled] = React.useState(initialData.doubleSidedRewardsEnabled);
  const [referrerBonus, setReferrerBonus] = React.useState(initialData.referrerRankingBonus);
  const [newParticipantBonus, setNewParticipantBonus] = React.useState(initialData.newParticipantRankingBonus);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState("");

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      await updateWaitlist(waitlistId, {
        doubleSidedRewardsEnabled: enabled,
        referrerRankingBonus: referrerBonus,
        newParticipantRankingBonus: newParticipantBonus,
      });
      setSaveMessage("Saved successfully");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err: unknown) {
      setSaveMessage(getApiErrorMessage(err, "Failed to save"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-foreground mb-1">Double-Sided Rewards</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Reward both the participant who shares their referral link and the new participant who joins through it. Ranking bonuses increase each participant's leaderboard score without changing their referral count.
          </p>

          <div className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              id="enable-ds-rewards"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <label htmlFor="enable-ds-rewards" className="text-sm font-medium text-foreground cursor-pointer">
              Enable Double-Sided Rewards
            </label>
          </div>

          {enabled && (
            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Referrer Ranking Bonus</label>
                <Input
                  type="number"
                  min="0"
                  value={referrerBonus}
                  onChange={(e) => setReferrerBonus(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Participant Ranking Bonus</label>
                <Input
                  type="number"
                  min="0"
                  value={newParticipantBonus}
                  onChange={(e) => setNewParticipantBonus(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes("Failed") ? "text-destructive" : "text-success"}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="pt-6 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-4">Analytics</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Rewards Granted</p>
              <p className="text-2xl font-bold text-foreground">{initialData.doubleSidedRewardsGranted}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Referrer Bonus</p>
              <p className="text-2xl font-bold text-success">+{initialData.totalReferrerRankingBonusAwarded}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Total New Participant Bonus</p>
              <p className="text-2xl font-bold text-success">+{initialData.totalNewParticipantRankingBonusAwarded}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
