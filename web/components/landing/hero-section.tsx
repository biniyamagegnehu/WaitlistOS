"use client";

import Link from "next/link";
import { routes } from "@/lib/routes";
import { Check, Layers } from "lucide-react";
import { FadeIn, SlideUp } from "./scroll-animations";

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden px-4 pt-16 pb-20 sm:pt-24 sm:pb-24 bg-background"
      id="hero"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          {/* Top Announcement */}
          <SlideUp>
            <FadeIn delay={0.2}>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                WaitlistOS includes powerful tools to help you launch in style.{" "}
                <Link href="#how-it-works" className="ml-1 underline underline-offset-2 hover:text-primary/80">
                  Explore Features
                </Link>
              </div>
            </FadeIn>
          </SlideUp>

          {/* Hero Content */}
          <SlideUp delay={0.1}>
            <h1 className="mb-2 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Grow Before Launch
            </h1>
            <h2 className="mb-10 text-xl sm:text-2xl lg:text-3xl font-medium text-muted-foreground max-w-2xl mx-auto">
              Build Your Audience Before You Launch
            </h2>
          </SlideUp>

          <SlideUp delay={0.2}>
            <Link
              href={routes.register}
              className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 mb-20 shadow-lg shadow-primary/25"
            >
              Get started now
            </Link>
          </SlideUp>

          {/* Grid Section */}
          <SlideUp delay={0.3} className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {/* Card 1: Founder preparing for launch */}
              <div className="relative aspect-square md:aspect-auto md:h-[400px] w-full overflow-hidden rounded-[2rem] bg-muted border border-border">
                <img
                  src="/hero-1.png"
                  alt="Founder preparing for launch"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>

              {/* Card 2: Waitlist Growth Dashboard */}
              <div className="relative aspect-square md:aspect-auto md:h-[400px] w-full overflow-hidden rounded-[2rem] bg-muted border border-border">
                <img
                  src="/hero-2.png"
                  alt="Waitlist Growth Dashboard"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>

              {/* Card 3: Launch Day */}
              <div className="relative aspect-square md:aspect-auto md:h-[400px] w-full overflow-hidden rounded-[2rem] bg-muted border border-border">
                <img
                  src="/hero-3.png"
                  alt="Founder smiling on Launch Day"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </SlideUp>
        </div>
      </div>
    </section>
  );
}
