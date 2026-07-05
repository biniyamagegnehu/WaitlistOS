import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <BrandLogo size="sm" />

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-6"
          >
            <Link
              href="/#features"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Login
            </Link>
          </nav>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} WaitlistOS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
