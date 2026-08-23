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
      <Card className="border-success/20 bg-success/5">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <p className="text-sm font-medium text-success-foreground">Priority access enabled</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Your position</p>
            <p className="text-lg font-semibold text-foreground">#{status.position}</p>
          </div>
          <Badge variant="success" className="w-full justify-center">
            Top 10% Priority
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
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary-foreground">Skip the Line</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            Move to the front of the waitlist with priority access
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Current position</p>
            <p className="text-sm font-semibold text-foreground">#{current_position}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {currency === "USD" ? "$" : ""}{price.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">One-time payment</p>
          </div>
          <Button
            onClick={handleSkipLine}
            disabled={processing}
            className="min-w-[120px]"
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
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive-foreground">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}