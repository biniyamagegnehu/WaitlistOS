"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, ArrowRight, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/axios";

interface PaymentStatus {
  payment: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    createdAt: string;
  };
  participant: {
    id: string;
    email: string;
    position: number;
    hasSkipLinePriority: boolean;
  };
  waitlist: {
    id: string;
    name: string;
    slug: string;
    skipLineEnabled: boolean;
  };
}

export default function SkipLineSuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading");
  const [paymentData, setPaymentData] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const MAX_POLLS = 100; // ~5 minutes with 3-second intervals

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Try to get payment ID from URL params first
        const paymentIdFromUrl = searchParams.get("payment_id");
        setPaymentId(paymentIdFromUrl);
        
        if (paymentIdFromUrl) {
          const response = await api.get(`/monetization/skip-line/status/${paymentIdFromUrl}`);
          
          if (response.data.payment.status === "SUCCEEDED") {
            setStatus("success");
            setPaymentData(response.data);
          } else if (response.data.payment.status === "PENDING") {
            if (pollCount >= MAX_POLLS) {
              setStatus("error");
              setError("Payment verification timed out. Please contact support or try manual verification.");
            } else {
              setStatus("pending");
              setPollCount(prev => prev + 1);
              setTimeout(checkPaymentStatus, 3000);
            }
          } else {
            setStatus("error");
            setError("Payment failed or was cancelled");
          }
        } else {
          // Fallback to latest payment using participant ID and waitlist ID from sessionStorage
          const participantId = sessionStorage.getItem('participantId');
          const waitlistId = sessionStorage.getItem('waitlistId');
          
          if (participantId && waitlistId) {
            const response = await api.get(`/monetization/skip-line/status/public/latest?participantId=${participantId}&waitlistId=${waitlistId}`);
            
            if (response.data.payment.status === "SUCCEEDED") {
              setStatus("success");
              setPaymentData(response.data);
            } else if (response.data.payment.status === "PENDING") {
              setPaymentId(response.data.payment.id);
              if (pollCount >= MAX_POLLS) {
                setStatus("error");
                setError("Payment verification timed out. Please contact support or try manual verification.");
              } else {
                setStatus("pending");
                setPollCount(prev => prev + 1);
                setTimeout(checkPaymentStatus, 3000);
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
        console.error("Failed to check payment status:", err);
        setStatus("error");
        setError("Unable to verify payment status");
      }
    };

    checkPaymentStatus();
  }, [searchParams]); // Only trigger on searchParams change, not pollCount

  const getReturnUrl = () => {
    if (paymentData?.waitlist) {
      return `/w/${paymentData.waitlist.slug}`;
    }
    return "/";
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Verifying your payment...</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Please wait while we confirm your Skip the Line purchase.
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
                Your payment is being confirmed. We'll update your position shortly.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Refresh Status
              </Button>
              {paymentId && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await api.post(`/monetization/skip-line/verify/${paymentId}`);
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
                {error || "There was an issue processing your payment."}
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

  if (status === "success" && paymentData) {
    const previousPosition = paymentData.participant.position; // This would need to be tracked separately
    const positionsMoved = Math.max(0, previousPosition - paymentData.participant.position);

    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-6 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                🎉 You're now in the priority group!
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your Skip the Line payment was successful
              </p>
            </div>

            <div className="flex gap-4 w-full">
              <Card className="flex-1">
                <CardContent className="py-4 text-center">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Your new position
                  </p>
                  <p className="text-3xl font-semibold text-foreground">
                    #{paymentData.participant.position}
                  </p>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="py-4 text-center">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </p>
                  <Badge variant="success" className="mt-1">
                    Priority
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {positionsMoved > 0 && (
              <div className="flex items-center gap-2 text-sm text-success">
                <TrendingUp className="h-4 w-4" />
                <span>You moved up {positionsMoved} positions!</span>
              </div>
            )}

            <div className="rounded-lg border border-border bg-surface p-4 text-left w-full">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Payment Details
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    {paymentData.payment.currency === "USD" ? "$" : ""}
                    {Number(paymentData.payment.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(paymentData.payment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-success/20 bg-success/10 p-4 text-left w-full">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <p className="text-xs font-medium text-success-foreground">Priority Access Granted</p>
              </div>
              <p className="text-sm text-foreground">
                You now have priority access and will appear above all regular participants in the waitlist.
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