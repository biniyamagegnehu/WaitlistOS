"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCart, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/axios";

interface PreOrderDepositCardProps {
  participantId: string;
  waitlistId: string;
}

interface PreOrderStatus {
  eligible: boolean;
  hasPaid: boolean;
  waitlist: {
    preOrderDepositEnabled: boolean;
    preOrderDepositAmount: number | null;
    preOrderDepositCurrency: string | null;
    preOrderDepositDescription: string | null;
  };
}

export function PreOrderDepositCard({
  participantId,
  waitlistId,
}: PreOrderDepositCardProps) {
  const [status, setStatus] = useState<PreOrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get(`/participants/${participantId}/pre-order-status?waitlistId=${waitlistId}`);
        setStatus(response.data.data);
      } catch (err) {
        console.error("Failed to fetch Pre-Order Deposit status:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [participantId, waitlistId]);

  const handleDeposit = async () => {
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

      const price = Number(status?.waitlist.preOrderDepositAmount) || 50;
      const currency = status?.waitlist.preOrderDepositCurrency || "USD";

      const response = await api.post("/monetization/pre-order/checkout", {
        waitlistId,
        participantId,
        paymentType: "PRE_ORDER_DEPOSIT",
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

  if (!status || !status.waitlist.preOrderDepositEnabled) {
    return null;
  }

  if (status.hasPaid) {
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
              <p className="text-sm font-semibold text-foreground">Deposit Paid</p>
              <p className="text-xs text-muted-foreground">Your spot is officially secured</p>
            </div>
          </div>
          <Badge variant="success" className="w-full justify-center py-1.5 text-xs font-semibold shadow-sm">
            Spot Secured
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (!status.eligible) {
    return null;
  }

  const price = Number(status.waitlist.preOrderDepositAmount) || 50;
  const currency = status.waitlist.preOrderDepositCurrency || "USD";
  const description = status.waitlist.preOrderDepositDescription;

  return (
    <Card className="group relative overflow-hidden border-primary/20 bg-surface shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-all group-hover:bg-primary/20" />
      <CardContent className="relative space-y-5 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Secure your spot</p>
              <p className="text-xs text-muted-foreground">Pre-order deposit</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-border bg-surface-muted/50 p-3">
          <p className="text-sm text-foreground leading-relaxed">
            {description || "Place a deposit to secure your spot for the product launch."}
          </p>
          <p className="mt-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3 text-success" />
            Credited toward final purchase
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {currency === "USD" ? "$" : ""}{price.toFixed(2)}
            </p>
            <p className="text-xs font-medium text-muted-foreground">Upfront deposit</p>
          </div>
          <Button
            onClick={handleDeposit}
            disabled={processing}
            className="min-w-[130px] shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Pay Deposit"
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
