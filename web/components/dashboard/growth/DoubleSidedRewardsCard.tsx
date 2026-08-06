"use client";

import * as React from "react";
import { DashboardWaitlist } from "@/types/dashboard";
import { updateWaitlist } from "@/services/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DoubleSidedRewardsCard({
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
        <CardTitle>Double-Sided Rewards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Reward both the participant who shares their referral link and the new participant who joins through it. Ranking bonuses increase each participant's leaderboard score without changing their referral count.
          </p>

          <div className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              id="enable-ds-rewards"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
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
