"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Trophy, TrendingUp, Gift, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { updateWaitlist } from "@/services/dashboard";
import { getTeamAnalytics } from "@/services/teams";
import type { TeamAnalytics } from "@/services/teams";
import type { DashboardWaitlist } from "@/types/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import toast from "react-hot-toast";

interface TeamReferralsCardProps {
  waitlistId: string;
  initialData: DashboardWaitlist;
}

export function TeamReferralsCard({ waitlistId, initialData }: TeamReferralsCardProps) {
  const [enabled, setEnabled] = React.useState(initialData.teamReferralsEnabled ?? false);
  const [maxTeamSize, setMaxTeamSize] = React.useState(initialData.maxTeamSize ?? 10);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState("");
  const [analytics, setAnalytics] = React.useState<TeamAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!initialData.teamReferralsEnabled) return;
    setAnalyticsLoading(true);
    getTeamAnalytics(waitlistId)
      .then((res) => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  }, [waitlistId, initialData.teamReferralsEnabled]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      await updateWaitlist(waitlistId, { 
        teamReferralsEnabled: enabled,
        maxTeamSize,
      } as Parameters<typeof updateWaitlist>[1]);
      setSaveMessage("Saved successfully");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      setSaveMessage(getApiErrorMessage(err, "Failed to save"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Team Referrals</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Let participants form teams and unlock shared milestone rewards.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              id="enable-team-referrals"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <label htmlFor="enable-team-referrals" className="text-sm font-medium text-foreground cursor-pointer">
              Enable Team Referrals
            </label>
          </div>

          {!enabled ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Enable Team Referrals to let participants collaborate, form teams, and earn shared rewards when their combined referrals hit milestones.
              </p>
            </div>
          ) : (
            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium text-foreground">Maximum Team Size</label>
              <div className="flex items-center gap-2 max-w-xs">
                <Input
                  type="number"
                  min={2}
                  max={100}
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">members</span>
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

        {initialData.teamReferralsEnabled && (
          <div className="pt-6 border-t border-border space-y-6">
            {/* Analytics Cards */}
            {analyticsLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : analytics ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <AnalyticStat icon={<Users className="h-4 w-4" />} label="Total Teams" value={analytics.totalTeams} />
                <AnalyticStat icon={<TrendingUp className="h-4 w-4" />} label="Active Teams" value={analytics.activeTeams} />
                <AnalyticStat icon={<Trophy className="h-4 w-4" />} label="Team Referrals" value={analytics.totalTeamReferrals} />
                <AnalyticStat icon={<Gift className="h-4 w-4" />} label="Rewards Granted" value={analytics.totalRewardsGranted} />
              </div>
            ) : null}

            {analytics?.topPerformingTeam && (
              <div className="rounded-lg border border-border bg-surface p-4 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Top Performing Team</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{analytics.topPerformingTeam.name}</p>
                  <Badge variant="info">{analytics.topPerformingTeam.totalReferrals} referrals</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Avg. team size: {analytics.avgTeamSize} members</p>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href={routes.waitlistTeams(waitlistId)}>
                <Button>Configure Team Milestones</Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
