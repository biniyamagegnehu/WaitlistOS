import Link from "next/link";
import type { Metadata } from "next";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pricing — WaitlistOS",
  description: "Simple, transparent pricing for WaitlistOS.",
};

export default function PricingPage() {
  return (
    <div className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-24 text-center">
        <h1 className="mb-4 text-4xl font-semibold text-foreground">
          Simple pricing
        </h1>
        <p className="mb-16 text-lg text-muted-foreground">
          Start for free. No credit card required.
        </p>

        <div className="grid gap-6 text-left md:grid-cols-3">
          <PricingCard
            name="Free"
            price="$0"
            period="Forever"
            features={["1 waitlist", "500 signups"]}
            href={routes.register}
            cta="Get Started Free"
            variant="default"
          />
          <PricingCard
            name="Starter"
            price="$19"
            period="per month"
            features={["5 waitlists", "5,000 signups"]}
            href={routes.register}
            cta="Get Starter"
            variant="featured"
          />
          <PricingCard
            name="Pro"
            price="$49"
            period="per month"
            features={[
              "Unlimited waitlists",
              "Unlimited signups",
              "Custom domain",
            ]}
            href={routes.register}
            cta="Get Pro"
            variant="default"
          />
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  features,
  href,
  cta,
  variant,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  href: string;
  cta: string;
  variant: "default" | "featured";
}) {
  const isFeatured = variant === "featured";

  return (
    <div
      className={
        isFeatured
          ? "flex flex-col rounded-md border border-primary/30 bg-surface p-8 shadow-sm"
          : "flex flex-col rounded-md border border-border bg-surface p-8 shadow-sm"
      }
    >
      <p
        className={
          isFeatured
            ? "mb-3 text-xs font-semibold uppercase tracking-widest text-primary"
            : "mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        }
      >
        {name}
      </p>
      <p className="mb-1 text-4xl font-semibold text-foreground">{price}</p>
      <p className="mb-8 text-sm text-muted-foreground">{period}</p>
      <ul className="mb-10 flex-1 space-y-3 text-sm text-foreground">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <span className="text-primary">✓</span> {feature}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={
          isFeatured
            ? "mt-auto block w-full rounded-md bg-primary py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            : "mt-auto block w-full rounded-md border border-border bg-background py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
        }
      >
        {cta}
      </Link>
    </div>
  );
}
