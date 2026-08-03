"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  useInitializePayment,
  usePaymentHistory,
  useSubscription,
  useCancelSubscription,
  useResumeSubscription
} from "@/hooks/use-billing";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import type { SubscriptionPlanCode, PaymentProvider, PaymentHistoryItem } from "@/types/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/loader";


export default function BillingPage() {
  const queryClient = useQueryClient();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: history, isLoading: historyLoading } = usePaymentHistory();
  const initializePayment = useInitializePayment();
  const cancelSubscription = useCancelSubscription();
  const resumeSubscription = useResumeSubscription();


  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanCode | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("CHAPA");
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<PaymentHistoryItem | null>(null);


  const startCheckout = (plan: SubscriptionPlanCode) => setSelectedPlan(plan);

  const handleContinuePayment = () => {
    if (!selectedPlan) return;
    initializePayment.mutate({ plan: selectedPlan, provider: selectedProvider }, {
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Unable to initialize payment. Try again."));
        setSelectedPlan(null);
      },
    });
  };

  const handleCancelSubscription = () => {
    cancelSubscription.mutate(undefined, {
      onSuccess: () => {
        toast.success("Subscription cancelled successfully. You will have access until the end of your billing cycle.");
        setCancelDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
      },
      onError: (error) => toast.error(getApiErrorMessage(error, "Failed to cancel subscription")),
    });
  };

  const handleResumeSubscription = () => {
    resumeSubscription.mutate(undefined, {
      onSuccess: () => {
        toast.success("Subscription resumed successfully.");
        queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
      },
      onError: (error) => toast.error(getApiErrorMessage(error, "Failed to resume subscription")),
    });
  };


  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-6 w-6 text-primary" />
      </div>
    );
  }

  const planCode = subscription?.planCode ?? "FREE";
  const isCancelled = subscription?.status === "CANCELLED";
  const isActive = subscription?.status === "ACTIVE";
  // We determine if it's cancelled but still valid if status is CANCELLED and expiresAt is in future
  const stillHasAccess = isCancelled && subscription?.expiresAt && new Date(subscription.expiresAt) > new Date();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription, billing information, and payment history.
        </p>
      </div>

      {/* Section 1: Current Subscription */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Current plan
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                {subscription?.planName ?? "Free"}
              </h2>
            </div>
            <Badge variant={isActive ? "default" : isCancelled ? "warning" : "outline"}>
              {subscription?.status ?? "ACTIVE"}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Billing cycle</p>
              <p className="font-medium text-foreground">
                {subscription?.billingCycle ?? "FREE"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-medium text-foreground">
                {subscription && subscription.amount > 0
                  ? `${subscription.amount} ${subscription.currency}`
                  : "$0"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Renews on</p>
              <p className="font-medium text-foreground">
                {subscription?.expiresAt
                  ? new Date(subscription.expiresAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Started at</p>
              <p className="font-medium text-foreground">
                {subscription?.startedAt
                  ? new Date(subscription.startedAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
          
          {stillHasAccess && (
            <div className="rounded-md bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-500">
              Your subscription is cancelled but you still have access until {new Date(subscription!.expiresAt!).toLocaleDateString()}.
            </div>
          )}

          {/* Section 2 & 3: Plan Management, Cancel / Resume */}
          <div className="flex flex-wrap gap-3 pt-2">
            {(planCode === "STARTER" || planCode === "PRO") && (
              <Button
                loading={initializePayment.isPending}
                disabled={initializePayment.isPending}
                onClick={() => startCheckout(planCode as SubscriptionPlanCode)}
              >
                Renew subscription
              </Button>
            )}
            {planCode === "FREE" && (
              <Button
                loading={initializePayment.isPending}
                disabled={initializePayment.isPending}
                onClick={() => startCheckout("STARTER")}
              >
                Upgrade to Starter
              </Button>
            )}
            {planCode !== "PRO" && (
              <Button
                variant="outline"
                loading={initializePayment.isPending}
                disabled={initializePayment.isPending}
                onClick={() => startCheckout("PRO")}
              >
                Upgrade to Pro
              </Button>
            )}
            <Link
              href={routes.pricing}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              View all plans
            </Link>
            
            <div className="ml-auto">
              {isActive && planCode !== "FREE" && (
                <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
                  Cancel Subscription
                </Button>
              )}
              {stillHasAccess && (
                <Button variant="outline" onClick={handleResumeSubscription} loading={resumeSubscription.isPending}>
                  Resume Subscription
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Section 4: Payment History */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Billing history</h3>

          {historyLoading ? (
            <Spinner className="h-5 w-5 text-primary" />
          ) : !history?.length ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Plan</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((payment) => (
                    <tr 
                      key={payment.id} 
                      className="cursor-pointer border-b border-border/60 hover:bg-surface-muted transition-colors"
                      onClick={() => setSelectedPaymentDetails(payment)}
                    >
                      <td className="py-3 pr-4">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">{payment.planCode}</td>
                      <td className="py-3 pr-4">{payment.amount} {payment.currency}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={payment.paymentStatus === "SUCCESS" ? "default" : "warning"}>
                          {payment.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 font-mono text-xs">{payment.providerReference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Choose Payment Method Modal */}
      <Dialog open={!!selectedPlan} onClose={() => setSelectedPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setSelectedProvider("CHAPA")}
                className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                  selectedProvider === "CHAPA"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-surface-muted"
                }`}
              >
                <div>
                  <h3 className="font-medium text-foreground">Chapa</h3>
                  <p className="text-sm text-muted-foreground">Local payments in ETB</p>
                </div>
                <div
                  className={`h-5 w-5 flex items-center justify-center rounded-full border ${
                    selectedProvider === "CHAPA"
                      ? "border-primary bg-primary"
                      : "border-border"
                  }`}
                >
                  {selectedProvider === "CHAPA" && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider("STRIPE")}
                className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                  selectedProvider === "STRIPE"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-surface-muted"
                }`}
              >
                <div>
                  <h3 className="font-medium text-foreground">Stripe</h3>
                  <p className="text-sm text-muted-foreground">International payments in USD</p>
                </div>
                <div
                  className={`h-5 w-5 flex items-center justify-center rounded-full border ${
                    selectedProvider === "STRIPE"
                      ? "border-primary bg-primary"
                      : "border-border"
                  }`}
                >
                  {selectedProvider === "STRIPE" && (
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
              </button>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedPlan(null)}
              disabled={initializePayment.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleContinuePayment}
              loading={initializePayment.isPending}
              disabled={initializePayment.isPending}
            >
              Continue to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-muted-foreground">
              Are you sure you want to cancel your subscription? You will still have access to premium features until the end of your current billing cycle. After that, your account will automatically be downgraded to the Free plan.
            </p>
            <p className="mt-4 font-semibold text-destructive">
              No refund will be issued for the current billing cycle.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelSubscription.isPending}>
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription} loading={cancelSubscription.isPending}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Payment Details Modal */}
      <Dialog open={!!selectedPaymentDetails} onClose={() => setSelectedPaymentDetails(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {selectedPaymentDetails && (
              <div className="space-y-4">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{new Date(selectedPaymentDetails.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{selectedPaymentDetails.planCode}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{selectedPaymentDetails.amount} {selectedPaymentDetails.currency}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">
                    <Badge variant={selectedPaymentDetails.paymentStatus === "SUCCESS" ? "default" : "warning"}>
                      {selectedPaymentDetails.paymentStatus}
                    </Badge>
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-b border-border pb-2">
                  <span className="text-muted-foreground">Provider Reference</span>
                  <span className="font-mono text-sm break-all">{selectedPaymentDetails.providerReference}</span>
                </div>
                {selectedPaymentDetails.transactionId && (
                  <div className="flex flex-col gap-1 pb-2">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="font-mono text-sm break-all">{selectedPaymentDetails.transactionId}</span>
                  </div>
                )}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPaymentDetails(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
