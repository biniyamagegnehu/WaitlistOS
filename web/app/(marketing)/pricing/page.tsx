import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — WaitlistOS",
  description: "Simple, transparent pricing for WaitlistOS.",
};

export default function PricingPage() {
  return (
    <div className="relative flex-1">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/8 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-24 text-center">
        <h1 className="text-4xl font-extrabold text-white mb-4">
          Simple pricing
        </h1>
        <p className="text-zinc-400 mb-16 text-lg">
          Start for free. No credit card required.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          {/* Free */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Free
            </p>
            <p className="text-4xl font-extrabold text-white mb-1">$0</p>
            <p className="text-sm text-zinc-500 mb-8">Forever</p>
            <ul className="space-y-3 mb-10 text-sm text-zinc-300 flex-1">
              {["1 waitlist", "500 signups"].map(
                (f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> {f}
                  </li>
                )
              )}
            </ul>
            <Link
              href="/register"
              className="block text-center w-full rounded-xl bg-white/10 border border-white/15 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors mt-auto"
            >
              Get Started Free
            </Link>
          </div>

          {/* Starter */}
          <div className="rounded-2xl border border-indigo-500/40 bg-indigo-600/10 p-8 flex flex-col relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">
              Starter
            </p>
            <p className="text-4xl font-extrabold text-white mb-1">$19</p>
            <p className="text-sm text-zinc-500 mb-8">per month</p>
            <ul className="space-y-3 mb-10 text-sm text-zinc-300 flex-1">
              {["5 waitlists", "5,000 signups"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-indigo-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block text-center w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-semibold text-white transition-colors mt-auto shadow-xl shadow-indigo-600/30"
            >
              Get Starter
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Pro
            </p>
            <p className="text-4xl font-extrabold text-white mb-1">$49</p>
            <p className="text-sm text-zinc-500 mb-8">per month</p>
            <ul className="space-y-3 mb-10 text-sm text-zinc-300 flex-1">
              {["Unlimited waitlists", "Unlimited signups", "Custom domain"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-indigo-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block text-center w-full rounded-xl bg-white/10 border border-white/15 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors mt-auto"
            >
              Get Pro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
