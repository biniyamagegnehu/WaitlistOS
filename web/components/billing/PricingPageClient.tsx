"use client";

import { useState } from "react";
import { PageContainer } from "@/components/patterns/page-container";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useInitializePayment, usePublicPlans } from "@/hooks/use-billing";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import type { PublicPlan, SubscriptionPlanCode, PaymentProvider } from "@/types/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/loader";
import toast from "react-hot-toast";

function formatPrice(plan: PublicPlan) {
  if (plan.price <= 0) {
    return "$0";
  }

  return `$${plan.price}`;
}

function planFeatures(plan: PublicPlan): string[] {
  switch (plan.code) {
    case "FREE":
      return ["1 waitlist", "500 signups"];
    case "STARTER":
      return ["5 waitlists", "5,000 signups"];
    case "PRO":
      return ["Unlimited waitlists & signups", "Custom domain"];
    default:
      return [];
  }
}

export default function PricingPageClient() {
  const { isAuthenticated } = useAuth();
  const { data: plans, isLoading, isError } = usePublicPlans();
  const initializePayment = useInitializePayment();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanCode | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("CHAPA");

  const handleSelectPlan = (plan: PublicPlan) => {
    if (plan.code === "FREE") {
      window.location.href = isAuthenticated ? routes.dashboard : routes.register;
      return;
    }

    if (!isAuthenticated) {
      window.location.href = routes.register;
      return;
    }

    setSelectedPlan(plan.code as SubscriptionPlanCode);
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

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="h-6 w-6 text-primary" />
      </div>
    );
  }

  if (isError || !plans?.length) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
        Unable to load pricing plans.
      </div>
    );
  }

  return (
    <div className="flex-1">
      <PageContainer withoutVerticalPadding className="py-24 text-center">
        <h1 className="mb-4 text-4xl font-semibold text-foreground">Simple pricing</h1>
        <p className="mb-16 text-lg text-muted-foreground">
          Start free. Upgrade when you are ready to scale.
        </p>

        <div className="grid gap-6 text-left md:grid-cols-3">
          {plans.map((plan) => {
            const featured = plan.code === "STARTER";
            const features = planFeatures(plan);

            return (
              <Card
                key={plan.code}
                className={
                  featured
                    ? "border-primary/30 bg-surface shadow-sm"
                    : "border-border bg-surface shadow-sm"
                }
              >
                <CardContent className="flex h-full flex-col p-8">
                  <p
                    className={
                      featured
                        ? "mb-3 text-xs font-semibold uppercase tracking-widest text-primary"
                        : "mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                    }
                  >
                    {plan.name}
                  </p>
                  <p className="mb-1 text-4xl font-semibold text-foreground">
                    {formatPrice(plan)}
                  </p>
                  <p className="mb-8 text-sm text-muted-foreground">
                    {plan.billingCycle === "FREE" ? "Forever" : "Per month"}
                  </p>

                  <ul className="mb-10 flex-1 space-y-3 text-sm text-foreground">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <span className="text-primary">✓</span> {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={featured ? "primary" : "outline"}
                    loading={initializePayment.isPending}
                    disabled={initializePayment.isPending}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.code === "FREE"
                      ? "Get Started Free"
                      : plan.code === "STARTER"
                        ? "Upgrade to Starter"
                        : "Upgrade to Pro"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={routes.billing} className="text-primary hover:underline">
            Manage billing
          </Link>
        </p>
      </PageContainer>

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
