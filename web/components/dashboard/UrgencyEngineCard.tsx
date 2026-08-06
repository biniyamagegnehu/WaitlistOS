import React from "react";
import { DashboardWaitlist } from "@/types/dashboard";
import { updateWaitlist } from "@/services/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Timer, AlertCircle, Percent } from "lucide-react";

interface UrgencyEngineCardProps {
  waitlistId: string;
  initialData: DashboardWaitlist;
}

export function UrgencyEngineCard({ waitlistId, initialData }: UrgencyEngineCardProps) {
  const [urgencyEnabled, setUrgencyEnabled] = React.useState(initialData.urgencyEnabled ?? false);
  const [batchEnabled, setBatchEnabled] = React.useState(initialData.batchEnabled ?? false);
  const [batchName, setBatchName] = React.useState(initialData.batchName || "");
  const [batchSize, setBatchSize] = React.useState(initialData.batchSize || 100);
  const [batchDescription, setBatchDescription] = React.useState(initialData.batchDescription || "");
  const [countdownEnabled, setCountdownEnabled] = React.useState(initialData.countdownEnabled ?? false);
  const [launchDate, setLaunchDate] = React.useState(
    initialData.launchDate ? new Date(initialData.launchDate).toISOString().slice(0, 16) : ""
  );
  
  const [showRemainingSpots, setShowRemainingSpots] = React.useState(initialData.showRemainingSpots ?? true);
  const [showBatchProgress, setShowBatchProgress] = React.useState(initialData.showBatchProgress ?? true);
  const [showCountdown, setShowCountdown] = React.useState(initialData.showCountdown ?? true);

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState("");

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      await updateWaitlist(waitlistId, {
        urgencyEnabled,
        batchEnabled,
        batchName: batchName || undefined,
        batchSize: batchSize || undefined,
        batchDescription: batchDescription || undefined,
        countdownEnabled,
        launchDate: launchDate ? new Date(launchDate).toISOString() : undefined,
        showRemainingSpots,
        showBatchProgress,
        showCountdown,
      } as Parameters<typeof updateWaitlist>[1]);
      setSaveMessage("Saved successfully");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      setSaveMessage(getApiErrorMessage(err, "Failed to save"));
    } finally {
      setIsSaving(false);
    }
  };

  const currentParticipants = initialData.totalParticipants || 0;
  const remainingSpots = Math.max(0, batchSize - currentParticipants);
  const progressPercent = Math.min(100, Math.round((currentParticipants / batchSize) * 100)) || 0;

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
        <div>
          <div className="flex items-center gap-3 mb-6">
            <input
              type="checkbox"
              id="enable-urgency"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              checked={urgencyEnabled}
              onChange={(e) => setUrgencyEnabled(e.target.checked)}
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
                    checked={batchEnabled}
                    onChange={(e) => setBatchEnabled(e.target.checked)}
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
                        value={batchName}
                        onChange={(e) => setBatchName(e.target.value)}
                        placeholder="e.g. Early Access"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Batch Size</label>
                      <Input
                        type="number"
                        min={1}
                        value={batchSize}
                        onChange={(e) => setBatchSize(Number(e.target.value))}
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-foreground">Batch Description (Optional)</label>
                      <Input
                        value={batchDescription}
                        onChange={(e) => setBatchDescription(e.target.value)}
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
                    checked={countdownEnabled}
                    onChange={(e) => setCountdownEnabled(e.target.checked)}
                  />
                  <label htmlFor="enable-countdown" className="text-sm font-semibold text-foreground cursor-pointer">
                    Enable Launch Countdown
                  </label>
                </div>

                {countdownEnabled && (
                  <div className="grid gap-4 sm:grid-cols-2 pl-7">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Launch Date & Time</label>
                      <Input
                        type="datetime-local"
                        value={launchDate}
                        onChange={(e) => setLaunchDate(e.target.value)}
                      />
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
                      checked={showRemainingSpots}
                      onChange={(e) => setShowRemainingSpots(e.target.checked)}
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
                      checked={showBatchProgress}
                      onChange={(e) => setShowBatchProgress(e.target.checked)}
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
                      checked={showCountdown}
                      onChange={(e) => setShowCountdown(e.target.checked)}
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
