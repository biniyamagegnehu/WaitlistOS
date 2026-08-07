"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardWaitlist } from "@/types/dashboard";
import { updateWaitlist } from "@/services/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const doubleSidedRewardsSchema = z
  .object({
    doubleSidedRewardsEnabled: z.boolean(),
    referrerRankingBonus: z.coerce
      .number({ invalid_type_error: "Ranking bonus is required." })
      .int("Ranking bonus must be an integer.")
      .min(1, "Ranking bonus must be at least 1.")
      .max(100, "Ranking bonus cannot exceed 100."),
    newParticipantRankingBonus: z.coerce
      .number({ invalid_type_error: "Ranking bonus is required." })
      .int("Ranking bonus must be an integer.")
      .min(1, "Ranking bonus must be at least 1.")
      .max(100, "Ranking bonus cannot exceed 100."),
  })
  .refine(
    (data) => {
      if (data.doubleSidedRewardsEnabled) {
        return data.newParticipantRankingBonus <= data.referrerRankingBonus;
      }
      return true;
    },
    {
      message: "New participant bonus cannot be greater than the referrer bonus.",
      path: ["newParticipantRankingBonus"],
    }
  );

type DoubleSidedRewardsFormData = z.infer<typeof doubleSidedRewardsSchema>;

export function DoubleSidedRewardsCard({
  waitlistId,
  initialData,
}: {
  waitlistId: string;
  initialData: DashboardWaitlist;
}) {
  const form = useForm<DoubleSidedRewardsFormData>({
    resolver: zodResolver(doubleSidedRewardsSchema),
    defaultValues: {
      doubleSidedRewardsEnabled: initialData.doubleSidedRewardsEnabled ?? false,
      referrerRankingBonus: initialData.referrerRankingBonus || 3,
      newParticipantRankingBonus: initialData.newParticipantRankingBonus || 3,
    },
    mode: "onChange",
  });

  const enabled = form.watch("doubleSidedRewardsEnabled");
  const isSaving = form.formState.isSubmitting;
  const isValid = form.formState.isValid;

  const handleSave = async (data: DoubleSidedRewardsFormData) => {
    try {
      await updateWaitlist(waitlistId, {
        doubleSidedRewardsEnabled: data.doubleSidedRewardsEnabled,
        referrerRankingBonus: data.referrerRankingBonus,
        newParticipantRankingBonus: data.newParticipantRankingBonus,
      });
      toast.success("Saved successfully");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to save settings"));
    }
  };

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Normalizes leading zeros by replacing them, e.g. "005" -> "5"
    let val = e.target.value;
    if (val.length > 1 && val.startsWith("0")) {
      val = val.replace(/^0+/, "");
      if (val === "") val = "0";
      e.target.value = val;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Double-Sided Rewards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={form.handleSubmit(handleSave)}>
          <p className="text-sm text-muted-foreground mb-4">
            Reward both the participant who shares their referral link and the new participant who joins through it. Ranking bonuses increase each participant's leaderboard score without changing their referral count.
          </p>

          <div className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              id="enable-ds-rewards"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              {...form.register("doubleSidedRewardsEnabled")}
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
                  min="1"
                  max="100"
                  inputMode="numeric"
                  onWheel={(e) => e.currentTarget.blur()}
                  {...form.register("referrerRankingBonus")}
                  onChange={(e) => {
                    handleNumericInput(e);
                    form.register("referrerRankingBonus").onChange(e);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 3–10 points. Maximum allowed: 100. Higher values have a larger impact on participant rankings.
                </p>
                {form.formState.errors.referrerRankingBonus && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.referrerRankingBonus.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Participant Ranking Bonus</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  inputMode="numeric"
                  onWheel={(e) => e.currentTarget.blur()}
                  {...form.register("newParticipantRankingBonus")}
                  onChange={(e) => {
                    handleNumericInput(e);
                    form.register("newParticipantRankingBonus").onChange(e);
                  }}
                />
                {form.formState.errors.newParticipantRankingBonus && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.newParticipantRankingBonus.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSaving || (!isValid && enabled)}>
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>

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
