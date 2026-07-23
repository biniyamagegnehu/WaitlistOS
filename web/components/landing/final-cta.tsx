"use client";

import Link from "next/link";
import { routes } from "@/lib/routes";
import { ArrowRight } from "lucide-react";
import { SlideUp } from "./scroll-animations";

export function FinalCTA() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <SlideUp>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 sm:px-12 sm:py-20">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            </div>

            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
              Start Building Your Launch Audience Today
            </h2>
            <p className="mb-8 text-lg text-primary-foreground/90">
              Create your waitlist, reward referrals, and grow demand before launch day.
            </p>
            <Link
              href={routes.register}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-background px-8 text-sm font-medium text-foreground transition-all hover:bg-background/90 hover:shadow-lg sm:text-base"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </SlideUp>
      </div>
    </section>
  );
}
