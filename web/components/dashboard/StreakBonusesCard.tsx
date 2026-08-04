"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/errors";
import { updateWaitlist } from "@/services/dashboard";
import type { DashboardWaitlist } from "@/types/dashboard";
import { routes } from "@/lib/routes";

interface StreakBonusesCardProps {
  waitlistId: string;
  initialData: DashboardWaitlist;
}

export function StreakBonusesCard({ waitlistId, initialData }: StreakBonusesCardProps) {
  const [enabled, setEnabled] = React.useState(initialData.streakBonusesEnabled);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState("");

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    setIsSaving(true);
    setSaveMessage("");
    try {
      await updateWaitlist(waitlistId, {
        streakBonusesEnabled: checked,
      });
      setSaveMessage("Saved successfully");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err: unknown) {
      setEnabled(!checked);
      setSaveMessage(getApiErrorMessage(err, "Failed to update streak bonuses settings"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Streak Bonuses</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Reward participants who refer friends consecutively over multiple days.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={isSaving}
          />
          <span className="text-sm font-medium">
            {enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {saveMessage && (
          <div className={`text-sm ${saveMessage.includes("Failed") ? "text-destructive" : "text-success"}`}>
            {saveMessage}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <p className="text-sm text-foreground">
            Streak bonuses create a habit loop by rewarding users who successfully refer at least one new participant each day. 
            When enabled, users will earn ranking boosts as they reach milestone days (e.g. Day 3, Day 7).
          </p>
          
          <div className="flex items-center gap-4 mt-2">
            <Link href={routes.waitlistStreaks?.(waitlistId) || `/dashboard/waitlists/${waitlistId}/streaks`}>
              <Button>
                Configure Streak Milestones
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
