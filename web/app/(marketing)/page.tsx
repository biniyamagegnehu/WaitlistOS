import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WaitlistOS — Launch with Momentum",
  description:
    "Create and manage waitlists for your product. Build hype, grow your audience, and launch with momentum.",
};

export default function HomePage() {
  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Background gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-purple-600/10 blur-[100px]" />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-24 sm:py-36 text-center" id="hero">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-600/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Early Access — Now Live
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Launch with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            momentum
          </span>
        </h1>

        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          WaitlistOS lets you create viral waitlists in minutes. Build hype,
          grow your audience, and reward early believers with a built-in
          referral system.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center rounded-2xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-600/30 transition-all hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start for Free
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-2xl bg-white/5 border border-white/15 px-8 py-4 text-base font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
          >
            Sign In →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-4">
            Everything you need to launch
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            From referral tracking to email notifications — WaitlistOS has all
            the tools founders need.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-white/20 hover:bg-white/8 transition-all duration-200"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 text-lg">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
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
