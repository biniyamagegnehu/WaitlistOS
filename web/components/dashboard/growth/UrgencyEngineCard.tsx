"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardWaitlist } from "@/types/dashboard";
import { updateWaitlist } from "@/services/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Timer, AlertCircle, Percent } from "lucide-react";
import toast from "react-hot-toast";

interface UrgencyEngineCardProps {
  waitlistId: string;
  initialData: DashboardWaitlist;
}

// Build schema with runtime current participant count for cross-field validation
function buildSchema(currentParticipants: number) {
  return z
    .object({
      urgencyEnabled: z.boolean(),
      batchEnabled: z.boolean(),
      batchName: z.string().optional(),
      batchSize: z.coerce
        .number({ invalid_type_error: "Batch size is required." })
        .int("Batch size must be an integer.")
        .min(1, "Batch size must be at least 1."),
      batchDescription: z.string().optional(),
      countdownEnabled: z.boolean(),
      launchDate: z.string().optional(),
      showRemainingSpots: z.boolean(),
      showBatchProgress: z.boolean(),
      showCountdown: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (data.urgencyEnabled && data.batchEnabled) {
        if (data.batchSize < currentParticipants) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["batchSize"],
            message: `Batch size cannot be smaller than the current participant count (${currentParticipants}).`,
          });
        }
      }
      if (data.urgencyEnabled && data.countdownEnabled && data.launchDate) {
        const chosen = new Date(data.launchDate);
        if (chosen <= new Date()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["launchDate"],
            message: "Launch date must be in the future.",
          });
        }
      }
    });
}

type UrgencyEngineFormData = z.infer<ReturnType<typeof buildSchema>>;

export function UrgencyEngineCard({ waitlistId, initialData }: UrgencyEngineCardProps) {
  const currentParticipants = initialData.totalParticipants || 0;

  const form = useForm<UrgencyEngineFormData>({
    resolver: zodResolver(buildSchema(currentParticipants)),
    defaultValues: {
      urgencyEnabled: initialData.urgencyEnabled ?? false,
      batchEnabled: initialData.batchEnabled ?? false,
      batchName: initialData.batchName || "",
      batchSize: initialData.batchSize || 100,
      batchDescription: initialData.batchDescription || "",
      countdownEnabled: initialData.countdownEnabled ?? false,
      launchDate: initialData.launchDate
        ? new Date(initialData.launchDate).toISOString().slice(0, 16)
        : "",
      showRemainingSpots: initialData.showRemainingSpots ?? true,
      showBatchProgress: initialData.showBatchProgress ?? true,
      showCountdown: initialData.showCountdown ?? true,
    },
    mode: "onChange",
  });

  const urgencyEnabled = form.watch("urgencyEnabled");
  const batchEnabled = form.watch("batchEnabled");
  const countdownEnabled = form.watch("countdownEnabled");
  const batchSize = form.watch("batchSize") || 0;
  const isSaving = form.formState.isSubmitting;
  const isValid = form.formState.isValid;

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length > 1 && val.startsWith("0")) {
      val = val.replace(/^0+/, "");
      if (val === "") val = "0";
      e.target.value = val;
    }
  };

  const handleSave = async (data: UrgencyEngineFormData) => {
    try {
      await updateWaitlist(waitlistId, {
        urgencyEnabled: data.urgencyEnabled,
        batchEnabled: data.batchEnabled,
        batchName: data.batchName || undefined,
        batchSize: data.batchSize || undefined,
        batchDescription: data.batchDescription || undefined,
        countdownEnabled: data.countdownEnabled,
        launchDate: data.launchDate ? new Date(data.launchDate).toISOString() : undefined,
        showRemainingSpots: data.showRemainingSpots,
        showBatchProgress: data.showBatchProgress,
        showCountdown: data.showCountdown,
      } as Parameters<typeof updateWaitlist>[1]);
      toast.success("Saved successfully");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save"));
    }
  };

  const remainingSpots = Math.max(0, batchSize - currentParticipants);
  const progressPercent = batchSize > 0
    ? Math.min(100, Math.round((currentParticipants / batchSize) * 100))
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Timer className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Urgency Engine</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create scarcity and urgency to increase conversions.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={form.handleSubmit(handleSave)}>
          <div className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              id="enable-urgency"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              {...form.register("urgencyEnabled")}
            />
            <label htmlFor="enable-urgency" className="text-sm font-medium text-foreground cursor-pointer">
              Enable Urgency Engine
            </label>
          </div>

          {!urgencyEnabled ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Enable Urgency Engine to display limited batch capacities and a countdown timer on your public waitlist page.
              </p>
            </div>
          ) : (
            <div className="space-y-8 mb-6">
              {/* Batch Configuration */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enable-batch"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    {...form.register("batchEnabled")}
                  />
                  <label htmlFor="enable-batch" className="text-sm font-semibold text-foreground cursor-pointer">
                    Enable Batch System
                  </label>
                </div>

                {batchEnabled && (
                  <div className="grid gap-4 sm:grid-cols-2 pl-7">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Batch Name</label>
                      <Input
                        {...form.register("batchName")}
                        placeholder="e.g. Early Access"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Batch Size</label>
                      <Input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        onWheel={(e) => e.currentTarget.blur()}
                        {...form.register("batchSize")}
                        onChange={(e) => {
                          handleNumericInput(e);
                          form.register("batchSize").onChange(e);
                        }}
                        placeholder="e.g. 100"
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be greater than or equal to the current participant count ({currentParticipants}).
                      </p>
                      {form.formState.errors.batchSize && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.batchSize.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-foreground">Batch Description (Optional)</label>
                      <Input
                        {...form.register("batchDescription")}
                        placeholder="e.g. The first 100 participants will receive early access."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Countdown Configuration */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enable-countdown"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    {...form.register("countdownEnabled")}
                  />
                  <label htmlFor="enable-countdown" className="text-sm font-semibold text-foreground cursor-pointer">
                    Enable Launch Countdown
                  </label>
                </div>

                {countdownEnabled && (
                  <div className="grid gap-4 sm:grid-cols-2 pl-7">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Launch Date &amp; Time</label>
                      <Input
                        type="datetime-local"
                        {...form.register("launchDate")}
                      />
                      <p className="text-xs text-muted-foreground">Must be a future date and time.</p>
                      {form.formState.errors.launchDate && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.launchDate.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Display Options */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground">Display Options</h4>
                <div className="pl-7 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="show-spots"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      {...form.register("showRemainingSpots")}
                    />
                    <label htmlFor="show-spots" className="text-sm text-foreground cursor-pointer">
                      Show Remaining Spots Counter
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="show-progress"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      {...form.register("showBatchProgress")}
                    />
                    <label htmlFor="show-progress" className="text-sm text-foreground cursor-pointer">
                      Show Batch Progress Bar
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="show-countdown-display"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      {...form.register("showCountdown")}
                    />
                    <label htmlFor="show-countdown-display" className="text-sm text-foreground cursor-pointer">
                      Show Countdown Timer
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSaving || (!isValid && urgencyEnabled)}>
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>

        {urgencyEnabled && batchEnabled && (
          <div className="pt-6 border-t border-border space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Batch Analytics</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <AnalyticStat icon={<Percent className="h-4 w-4" />} label="Progress" value={`${progressPercent}%`} />
              <AnalyticStat icon={<Timer className="h-4 w-4" />} label="Remaining Spots" value={remainingSpots} />
              <AnalyticStat icon={<AlertCircle className="h-4 w-4" />} label="Joined" value={currentParticipants} />
              <AnalyticStat icon={<AlertCircle className="h-4 w-4" />} label="Batch Size" value={batchSize} />
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
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
