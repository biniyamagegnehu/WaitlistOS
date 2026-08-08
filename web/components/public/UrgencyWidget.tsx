"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Timer, Zap, Users, Rocket } from "lucide-react";
import { motion } from "framer-motion";

interface UrgencyWidgetProps {
  urgencyEnabled?: boolean;
  batchEnabled?: boolean;
  batchName?: string | null;
  batchSize?: number | null;
  batchDescription?: string | null;
  countdownEnabled?: boolean;
  launchDate?: string | null;
  showRemainingSpots?: boolean;
  showBatchProgress?: boolean;
  showCountdown?: boolean;
  currentParticipants: number;
  batchUrgency?: {
    size: number;
    number: number;
    participants: number;
    remaining: number;
    progress: number;
    status: 'NEW' | 'ACTIVE' | 'NEARLY_FULL';
    launch?: {
      date: string;
      status: 'UPCOMING' | 'LIVE';
    } | null;
  } | null;
}

export function UrgencyWidget({
  urgencyEnabled,
  batchEnabled,
  batchName,
  batchSize,
  batchDescription,
  countdownEnabled,
  launchDate,
  showRemainingSpots,
  showBatchProgress,
  showCountdown,
  currentParticipants,
  batchUrgency,
}: UrgencyWidgetProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isLaunched, setIsLaunched] = useState(false);

  useEffect(() => {
    if (!countdownEnabled || !launchDate) return;

    const target = new Date(launchDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance <= 0) {
        setIsLaunched(true);
        setTimeLeft(null);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [countdownEnabled, launchDate]);

  if (!urgencyEnabled) return null;

  // Use batchUrgency data if available, otherwise fall back to calculation
  const batchData = batchUrgency || {
    size: batchSize || 100,
    number: Math.floor(currentParticipants / (batchSize || 100)) + 1,
    participants: currentParticipants % (batchSize || 100),
    remaining: (batchSize || 100) - (currentParticipants % (batchSize || 100)),
    progress: Math.min(100, Math.round(((currentParticipants % (batchSize || 100)) / (batchSize || 100)) * 100)),
    status: (currentParticipants % (batchSize || 100)) === 0 ? 'NEW' : ((batchSize || 100) - (currentParticipants % (batchSize || 100))) <= 10 ? 'NEARLY_FULL' : 'ACTIVE',
    launch: null,
  };

  const displayBatch = batchEnabled && (showRemainingSpots || showBatchProgress);
  const displayCountdown = countdownEnabled && showCountdown;

  if (!displayBatch && !displayCountdown) return null;

  return (
    <div className="w-full space-y-4 mb-8">
      {displayCountdown && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-surface p-5 text-center"
        >
          {isLaunched || (batchData.launch?.status === 'LIVE') ? (
            <div className="space-y-2">
              <div className="mx-auto w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-2">
                <Rocket className="h-5 w-5 text-success" />
              </div>
              <h3 className="text-lg font-bold text-foreground">🚀 We're live!</h3>
              <p className="text-sm text-muted-foreground">Don't miss out—join the waitlist now to get early access and exclusive updates!</p>
            </div>
          ) : timeLeft ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-2">
                <Rocket className="h-4 w-4" />
                Be among the first
              </h3>
              <p className="text-sm text-muted-foreground">We're launching soon. Join the waitlist to get early access.</p>
              <div className="flex justify-center gap-2 sm:gap-4">
                <CountdownBox value={timeLeft.days} label="DAYS" />
                <CountdownBox value={timeLeft.hours} label="HOURS" />
                <CountdownBox value={timeLeft.minutes} label="MINUTES" />
                <CountdownBox value={timeLeft.seconds} label="SECONDS" />
              </div>
            </div>
          ) : (
            <div className="animate-pulse h-16 bg-muted/30 rounded-lg"></div>
          )}
        </motion.div>
      )}

      {displayBatch && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-5 relative overflow-hidden"
        >
          {/* Decorative background glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            {batchData.status === 'NEW' && (
              <div className="text-center space-y-3">
                <Badge variant="success" className="mb-1 text-sm py-1 px-3">
                  🎉 A new {batchData.size === 1 ? 'spot' : 'batch'} just opened!
                </Badge>
                <p className="text-sm text-foreground font-medium">
                  Be among the first {batchData.size} to {batchData.size === 1 ? 'claim it' : 'join this batch'}.
                </p>
              </div>
            )}

            {batchData.status === 'ACTIVE' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      🔥 {batchData.remaining} {batchData.remaining === 1 ? 'spot' : 'spots'} left in this batch
                    </h3>
                  </div>
                </div>

                {showBatchProgress && (
                  <div className="space-y-2">
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-primary/10" role="progressbar" aria-valuenow={batchData.participants} aria-valuemin={0} aria-valuemax={batchData.size} aria-label={`${batchData.participants} of ${batchData.size} spots in the current batch have been claimed. ${batchData.remaining} spots remaining.`}>
                      <motion.div
                        className="bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${batchData.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Users className="h-3 w-3" /> {batchData.participants} / {batchData.size} joined</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {batchData.status === 'NEARLY_FULL' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      {batchData.remaining === 1 
                        ? '⚡ Only 1 spot left in this batch!' 
                        : `🔥 Only ${batchData.remaining} spots left!`}
                    </h3>
                  </div>
                </div>

                {showBatchProgress && (
                  <div className="space-y-2">
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-primary/10" role="progressbar" aria-valuenow={batchData.participants} aria-valuemin={0} aria-valuemax={batchData.size} aria-label={`${batchData.participants} of ${batchData.size} spots in the current batch have been claimed. ${batchData.remaining} spots remaining.`}>
                      <motion.div
                        className="bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${batchData.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Users className="h-3 w-3" /> {batchData.participants} / {batchData.size} joined</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg bg-background border border-border shadow-sm mb-1.5 relative overflow-hidden">
        {/* Subtle top glare */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/5 pointer-events-none" />
        <span className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}
