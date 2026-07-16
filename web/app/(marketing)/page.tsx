import Link from "next/link";
import type { Metadata } from "next";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "WaitlistOS — Launch with Momentum",
  description:
    "Create and manage waitlists for your product. Build hype, grow your audience, and launch with momentum.",
};

export default function HomePage() {
  return (
    <div className="flex-1">
      <section
        className="mx-auto max-w-4xl px-4 py-24 text-center sm:py-32"
        id="hero"
      >
        <div className="mb-8 inline-flex items-center gap-2 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
          Early access — now live
        </div>

        <h1 className="mb-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Launch with momentum
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          WaitlistOS lets you create viral waitlists in minutes. Build hype,
          grow your audience, and reward early believers with a built-in
          referral system.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={routes.register}
            className="inline-flex h-11 items-center bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Start for Free
          </Link>
          <Link
            href={routes.login}
            className="inline-flex h-11 items-center bg-surface px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section
        id="features"
        className="bg-surface py-16 sm:py-24"
      >
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-3xl font-semibold text-foreground">
              Everything you need to launch
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              From referral tracking to email notifications — WaitlistOS has all
              the tools founders need.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-background p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center bg-primary/10 text-lg text-primary">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    icon: "⚡",
    title: "Instant Setup",
    description:
      "Create a fully-featured waitlist in under a minute. Just pick a name, slug, and you're live.",
  },
  {
    icon: "🔗",
    title: "Viral Referral System",
    description:
      "Every participant gets a unique referral link. Refer friends, move up the list.",
  },
  {
    icon: "📧",
    title: "Automated Emails",
    description:
      "Send beautiful welcome and position-update emails automatically when participants join.",
  },
  {
    icon: "📊",
    title: "Founder Dashboard",
    description:
      "See all your waitlists, participant counts, and referral stats in one place.",
  },
  {
    icon: "🔒",
    title: "Secure Auth",
    description:
      "Google OAuth and email/password login for founders. Simple and secure.",
  },
  {
    icon: "📤",
    title: "CSV Export",
    description:
      "Export your participant list as a CSV at any time to use in your own tools.",
  },
];
