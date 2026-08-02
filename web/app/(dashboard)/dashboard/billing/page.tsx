"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useInitializePayment,
  usePaymentHistory,
  useSubscription,
} from "@/hooks/use-billing";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import type { SubscriptionPlanCode, PaymentProvider } from "@/types/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/loader";
import toast from "react-hot-toast";

export default function BillingPage() {
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: history, isLoading: historyLoading } = usePaymentHistory();
  const initializePayment = useInitializePayment();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanCode | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("CHAPA");

  const startCheckout = (plan: SubscriptionPlanCode) => {
    setSelectedPlan(plan);
  };

  const handleContinuePayment = () => {
    if (!selectedPlan) return;
    initializePayment.mutate({ plan: selectedPlan, provider: selectedProvider }, {
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Unable to initialize payment. Try again."));
        setSelectedPlan(null);
      },
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and payment history.
        </p>
      </div>

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
            <Badge variant="default">{subscription?.status ?? "ACTIVE"}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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
                  ? `$${subscription.amount}`
                  : "$0"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Renews</p>
              <p className="font-medium text-foreground">
                {subscription?.expiresAt
                  ? new Date(subscription.expiresAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
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
          </div>
        </CardContent>
      </Card>

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
                    <tr key={payment.id} className="border-b border-border/60">
                      <td className="py-3 pr-4">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">{payment.planCode}</td>
                      <td className="py-3 pr-4">${payment.amount}</td>
                      <td className="py-3 pr-4">{payment.paymentStatus}</td>
                      <td className="py-3 font-mono text-xs">{payment.providerReference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-foreground">Invoices</h3>
          <p className="text-sm text-muted-foreground">
            Invoice downloads will be available here in a future update.
          </p>
        </CardContent>
      </Card>

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
                  className={`h-5 w-5 rounded-full border flex items-center justify-center ${
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
                  className={`h-5 w-5 rounded-full border flex items-center justify-center ${
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
    </div>
  );
}
