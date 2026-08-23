"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, ArrowRight, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/axios";

interface DepositStatus {
  deposit: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    policy: string;
    createdAt: string;
  };
  participant: {
    id: string;
    email: string;
    position: number;
  };
  waitlist: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function PreOrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading");
  const [depositData, setDepositData] = useState<DepositStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const MAX_POLLS = 100;

  useEffect(() => {
    const checkDepositStatus = async () => {
      try {
        const depositIdFromUrl = searchParams.get("deposit_id");
        const paymentIdFromUrl = searchParams.get("payment_id");

        setPaymentId(paymentIdFromUrl);

        // Use depositId or paymentId from URL
        const idToCheck = depositIdFromUrl || paymentIdFromUrl;

        if (idToCheck) {
          const response = await api.get(`/monetization/pre-order/status/${idToCheck}`);

          if (response.data.deposit?.status === "PAID") {
            setStatus("success");
            setDepositData(response.data);
          } else if (response.data.deposit?.status === "PENDING") {
            if (pollCount >= MAX_POLLS) {
              setStatus("error");
              setError("Payment verification timed out. Please contact support.");
            } else {
              setStatus("pending");
              if (!paymentId && response.data.deposit?.monetizationPaymentId) {
                setPaymentId(response.data.deposit.monetizationPaymentId);
              }
              setPollCount(prev => prev + 1);
              setTimeout(checkDepositStatus, 3000);
            }
          } else {
            setStatus("error");
            setError("Payment failed or was cancelled");
          }
        } else {
          // Fallback to sessionStorage
          const participantId = sessionStorage.getItem('participantId');
          const waitlistId = sessionStorage.getItem('waitlistId');

          if (participantId && waitlistId) {
            const response = await api.get(
              `/monetization/pre-order/status/public/latest?participantId=${participantId}&waitlistId=${waitlistId}`
            );

            if (response.data.deposit?.status === "PAID") {
              setStatus("success");
              setDepositData(response.data);
            } else if (response.data.deposit?.status === "PENDING") {
              if (pollCount >= MAX_POLLS) {
                setStatus("error");
                setError("Payment verification timed out. Please contact support.");
              } else {
                setStatus("pending");
                // Set the underlying paymentId so we can manually verify
                if (!paymentId && response.data.deposit?.monetizationPaymentId) {
                  setPaymentId(response.data.deposit.monetizationPaymentId);
                }
                setPollCount(prev => prev + 1);
                setTimeout(checkDepositStatus, 3000);
              }
            } else {
              setStatus("error");
              setError("Payment failed or was cancelled");
            }
          } else {
            setStatus("error");
            setError("Unable to verify payment - missing participant information");
          }
        }
      } catch (err) {
        console.error("Failed to check deposit status:", err);
        setStatus("error");
        setError("Unable to verify payment status");
      }
    };

    checkDepositStatus();
  }, [searchParams]);

  const getReturnUrl = () => {
    if (depositData?.waitlist) {
      return `/w/${depositData.waitlist.slug}`;
    }
    const slug = sessionStorage.getItem('lastWaitlistSlug');
    return slug ? `/w/${slug}` : "/";
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Verifying your deposit...</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Please wait while we confirm your pre-order deposit.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Payment processing...</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your deposit is being confirmed. This page will update automatically.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                Refresh Status
              </Button>
              {paymentId && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await api.post(`/monetization/pre-order/verify/${paymentId}`);
                      window.location.reload();
                    } catch (err) {
                      console.error("Manual verification failed:", err);
                      setError("Manual verification failed. Please contact support.");
                    }
                  }}
                  className="mt-4"
                >
                  Verify Manually
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <CheckCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Payment Issue</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {error || "There was an issue processing your deposit."}
              </p>
            </div>
            <Button onClick={() => router.push(getReturnUrl())} className="mt-4">
              Return to Waitlist
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success" && depositData) {
    const isRefundable = depositData.deposit.policy === "REFUNDABLE";

    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-6 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                🎉 Your spot is secured!
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your pre-order deposit for <strong>{depositData.waitlist.name}</strong> was successful.
              </p>
            </div>

            <div className="flex gap-4 w-full">
              <Card className="flex-1">
                <CardContent className="py-4 text-center">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Your position
                  </p>
                  <p className="text-3xl font-semibold text-foreground">
                    #{depositData.participant.position}
                  </p>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="py-4 text-center">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </p>
                  <Badge variant="success" className="mt-1">
                    Reserved
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4 text-left w-full">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Deposit Details
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium">
                    {depositData.deposit.currency === "USD" ? "$" : ""}
                    {Number(depositData.deposit.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Policy</span>
                  <span className="font-medium">{isRefundable ? "Fully Refundable" : "Credit Toward Purchase"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(depositData.deposit.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-success/20 bg-success/10 p-4 text-left w-full">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-4 w-4 text-success" />
                <p className="text-xs font-medium text-success-foreground">Reservation Confirmed</p>
              </div>
              <p className="text-sm text-foreground">
                {isRefundable
                  ? "Your deposit is fully refundable if you change your mind."
                  : "Your deposit will be applied as credit toward your purchase."}
              </p>
            </div>

            <Button onClick={() => router.push(getReturnUrl())} className="w-full">
              Return to Waitlist
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
