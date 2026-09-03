"use client";

import Link from "next/link";
import { routes } from "@/lib/routes";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Animates in on mount — NOT scroll-triggered.
 * Used for above-the-fold hero content so everything
 * appears immediately when the page loads.
 */
function Appear({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden px-4 pt-12 pb-24 sm:pt-16 sm:pb-32 bg-[#faf9f7] dark:bg-[#111110]"
      id="hero"
    >
      {/* ── Dot-grid — light ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          backgroundImage: "radial-gradient(circle, #ccc8c0 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.65,
        }}
      />

      {/* ── Dot-grid — dark ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          backgroundImage: "radial-gradient(circle, #2a2a28 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.9,
        }}
      />

      {/* ── Centre glow — light ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background:
            "radial-gradient(ellipse 72% 58% at 50% 38%, #faf9f7 10%, transparent 100%)",
        }}
      />

      {/* ── Centre glow — dark ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            "radial-gradient(ellipse 72% 58% at 50% 38%, #111110 10%, transparent 100%)",
        }}
      />

      {/* ── Content ── */}
      <div className="relative mx-auto max-w-4xl flex flex-col items-center text-center">

        {/* Eyebrow pill */}
        <Appear delay={0.05}>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-white/85 dark:bg-surface/80 backdrop-blur-sm px-3 py-1.5 text-sm shadow-sm">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
              style={{ background: "var(--primary)" }}
            >
              New
            </span>
            <span className="text-muted-foreground font-medium">
              Grow Before Launch
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </Appear>

        {/* Headline */}
        <Appear delay={0.15}>
          <h1 className="mb-5 text-[2rem] font-bold tracking-tight text-foreground sm:text-4xl lg:text-[3rem] leading-[1.12]">
            Create a Waitlist, Grow Your Audience, and{" "}
            <em
              style={{
                fontFamily:
                  "var(--font-playfair), Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                color: "var(--primary)",
                fontWeight: 700,
              }}
            >
              Build Demand
            </em>{" "}
            Before You Launch
          </h1>
        </Appear>

        {/* Description */}
        <Appear delay={0.25}>
          <p className="mb-10 max-w-xl text-sm sm:text-[0.95rem] text-muted-foreground leading-relaxed">
            With WaitlistOS, you can launch a branded waitlist in minutes,
            collect and manage interested customers, encourage referrals, and
            build an audience you can bring with you when launch day arrives.
          </p>
        </Appear>

        {/* CTAs */}
        <Appear delay={0.35}>
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
            {/* Primary */}
            <Link
              href={routes.register}
              id="hero-cta-get-started"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-7 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, #ff6b3d 100%)",
                boxShadow: "0 4px 20px rgba(254,74,21,0.35)",
              }}
            >
              Get Started
              <span className="flex -space-x-1.5 text-white/80">
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4" />
              </span>
            </Link>

            {/* Ghost */}
            <Link
              href="#how-it-works"
              id="hero-cta-how-it-works"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-foreground/[0.06]"
            >
              See How It Works
            </Link>
          </div>
        </Appear>

        {/* Image Grid */}
        <Appear delay={0.45} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {/* Card 1 */}
            <div className="relative aspect-square md:aspect-auto md:h-[380px] w-full overflow-hidden rounded-[2rem] bg-muted border border-border">
              <img
                src="/hero-1.png"
                alt="Founder preparing for launch"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>

            {/* Card 2 */}
            <div className="relative aspect-square md:aspect-auto md:h-[380px] w-full overflow-hidden rounded-[2rem] bg-muted border border-border">
              <img
                src="/hero-2.png"
                alt="Waitlist Growth Dashboard"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>

            {/* Card 3 */}
            <div className="relative aspect-square md:aspect-auto md:h-[380px] w-full overflow-hidden rounded-[2rem] bg-muted border border-border">
              <img
                src="/hero-3.png"
                alt="Founder smiling on Launch Day"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </Appear>
      </div>
    </section>
  );
}
