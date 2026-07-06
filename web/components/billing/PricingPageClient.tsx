"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useInitializePayment, usePublicPlans } from "@/hooks/use-billing";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import type { PublicPlan, SubscriptionPlanCode } from "@/types/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/loader";
import { useToast } from "@/components/ui/toast";

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
  const { toast } = useToast();
  const { data: plans, isLoading, isError } = usePublicPlans();
  const initializePayment = useInitializePayment();

  const handleSelectPlan = (plan: PublicPlan) => {
    if (plan.code === "FREE") {
      window.location.href = isAuthenticated ? routes.dashboard : routes.register;
      return;
    }

    if (!isAuthenticated) {
      window.location.href = routes.register;
      return;
    }

    initializePayment.mutate(plan.code as SubscriptionPlanCode, {
      onError: (error) => {
        toast({
          title: "Payment could not start",
          description: getApiErrorMessage(error, "Unable to connect to Chapa. Try again."),
          variant: "error",
        });
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
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
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
      </div>
    </div>
  );
}
