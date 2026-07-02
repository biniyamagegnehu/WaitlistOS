import Link from "next/link";
import { Zap } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#0d0d14]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm tracking-tight">WaitlistOS</span>
          </Link>

          {/* Links */}
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-6">
            <Link
              href="/#features"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Login
            </Link>
          </nav>

          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} WaitlistOS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
