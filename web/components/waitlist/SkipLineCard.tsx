"use client";

import React, { useState, useEffect } from "react";
import { Zap, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/axios";

interface SkipLineCardProps {
  participantId: string;
  waitlistId: string;
  current_position: number;
  hasPriority: boolean;
}

interface SkipLineStatus {
  eligible: boolean;
  hasPriority: boolean;
  waitlist: {
    skipLineEnabled: boolean;
    skipLinePrice: number | null;
    skipLineCurrency: string | null;
  };
  position: number;
}

export function SkipLineCard({
  participantId,
  waitlistId,
  current_position,
  hasPriority,
}: SkipLineCardProps) {
  const [status, setStatus] = useState<SkipLineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get(`/participants/${participantId}/skip-line-status?waitlistId=${waitlistId}`);
        setStatus(response.data.data);
      } catch (err) {
        console.error("Failed to fetch Skip the Line status:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [participantId, waitlistId]);

  const handleSkipLine = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Store participant and waitlist info for payment verification
      sessionStorage.setItem('participantId', participantId);
      sessionStorage.setItem('waitlistId', waitlistId);

      // Store the waitlist slug for return after payment
      const waitlistSlug = window.location.pathname.split('/').pop();
      if (waitlistSlug) {
        sessionStorage.setItem('lastWaitlistSlug', waitlistSlug);
      }

      const price = Number(status?.waitlist.skipLinePrice) || 10;
      const currency = status?.waitlist.skipLineCurrency || "USD";

      const response = await api.post("/monetization/skip-line/checkout", {
        waitlistId,
        participantId,
        paymentType: "SKIP_LINE",
        amount: price,
        currency: currency,
      });

      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to initiate checkout. Please try again.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status || !status.waitlist.skipLineEnabled) {
    return null;
  }

  if (status.hasPriority || hasPriority) {
    return (
      <Card className="relative overflow-hidden border-success/30 bg-success/5 shadow-sm transition-all hover:shadow-md">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-success/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-success/10 blur-3xl" />
        <CardContent className="relative space-y-4 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/20">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Priority Access Enabled</p>
              <p className="text-xs text-muted-foreground">You've moved to the front of the line</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-success/10 bg-success/5 p-3">
            <p className="text-xs font-medium text-muted-foreground">Your priority position</p>
            <p className="text-xl font-bold text-success">#{status.position}</p>
          </div>
          <Badge variant="success" className="w-full justify-center py-1.5 text-xs font-semibold shadow-sm">
            Top Priority Guaranteed
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (!status.eligible) {
    return null;
  }

  const price = Number(status.waitlist.skipLinePrice) || 10;
  const currency = status.waitlist.skipLineCurrency || "USD";

  return (
    <Card className="group relative overflow-hidden border-primary/20 bg-surface shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-all group-hover:bg-primary/20" />
      <CardContent className="relative space-y-5 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Skip the Line</p>
              <p className="text-xs text-muted-foreground">Get priority access</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
            Recommended
          </Badge>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Current position</p>
            <p className="text-sm font-semibold text-foreground">#{current_position}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {currency === "USD" ? "$" : ""}{price.toFixed(2)}
            </p>
            <p className="text-xs font-medium text-muted-foreground">One-time payment</p>
          </div>
          <Button
            onClick={handleSkipLine}
            disabled={processing}
            className="min-w-[130px] shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Get Priority"
            )}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive-foreground">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}