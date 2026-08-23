"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCart, CheckCircle, Loader2 } from "lucide-react";
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
    preOrderDepositPolicy: string | null;
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
      <Card className="border-success/20 bg-success/5">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <p className="text-sm font-medium text-success-foreground">Deposit Paid</p>
          </div>
          <p className="text-sm text-foreground">
            You've successfully secured your reservation with a deposit.
          </p>
          <Badge variant="success" className="w-full justify-center">
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
  const policy = status.waitlist.preOrderDepositPolicy;
  const description = status.waitlist.preOrderDepositDescription;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary-foreground">Secure your spot</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            {description || "Place a deposit to secure your spot for the product launch."}
          </p>
          {policy === "REFUNDABLE" && (
            <p className="text-xs text-success flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Fully refundable
            </p>
          )}
          {policy === "CREDIT_TOWARD_PURCHASE" && (
            <p className="text-xs text-muted-foreground">
              Deposit will be credited toward your final purchase.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {currency === "USD" ? "$" : ""}{price.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Upfront deposit</p>
          </div>
          <Button
            onClick={handleDeposit}
            disabled={processing}
            className="min-w-[120px]"
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
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive-foreground">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
