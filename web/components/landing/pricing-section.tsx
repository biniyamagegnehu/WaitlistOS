"use client";

import Link from "next/link";
import { routes } from "@/lib/routes";
import { CheckCircle2 } from "lucide-react";
import { SlideUp, StaggerContainer, StaggerItem } from "./scroll-animations";

export function PricingSection() {
  return (
    <section className="py-16 sm:py-24" id="pricing">
      <div className="mx-auto max-w-7xl px-4">
        <SlideUp>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>
        </SlideUp>

        <StaggerContainer className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "Free",
              price: "$0",
              desc: "Perfect for getting started",
              features: ["1 waitlist", "100 participants", "Basic analytics", "Email support"],
              cta: "Start Free",
              popular: false,
            },
            {
              name: "Starter",
              price: "$19",
              desc: "For growing waitlists",
              features: ["3 waitlists", "1,000 participants", "Advanced analytics", "Priority support", "Custom branding"],
              cta: "Get Started",
              popular: true,
            },
            {
              name: "Pro",
              price: "$49",
              desc: "For serious founders",
              features: ["Unlimited waitlists", "10,000 participants", "API access", "Dedicated support", "White-label option"],
              cta: "Get Started",
              popular: false,
            },
          ].map((plan, i) => (
            <StaggerItem key={i}>
              <div
                className={`relative rounded-2xl border p-8 transition-all hover:shadow-xl ${
                  plan.popular
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-background hover:border-primary/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-semibold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={routes.register}
                  className={`mt-8 block w-full rounded-xl py-3.5 text-center text-sm font-medium transition-all ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25"
                      : "border-2 border-border bg-surface text-foreground hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
