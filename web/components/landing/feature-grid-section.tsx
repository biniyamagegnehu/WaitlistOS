"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type FeatureId = "waitlist" | "referrals" | "analytics" | "gates";

interface FeatureItem {
  id: FeatureId;
  navTitle: string;
  subtitle: string;
  description: string;
  image: string;
}

const features: FeatureItem[] = [
  {
    id: "waitlist",
    navTitle: "Waitlist Management",
    subtitle: "Set once, then launch",
    description:
      "Keep your audience organized with branded signup flows that show positions, milestones and real-time updates automatically.",
    image: "/feat-waitlist.png",
  },
  {
    id: "referrals",
    navTitle: "Referral Engine",
    subtitle: "Turn signups into growth",
    description:
      "Give every participant a unique link. When friends join, they climb the list and unlock custom rewards — all on autopilot.",
    image: "/feat-referral.png",
  },
  {
    id: "analytics",
    navTitle: "Analytics Dashboard",
    subtitle: "Real-time launch telemetry",
    description:
      "Track signups, referral velocity, and conversion trends with clean dashboards and instant CSV exports whenever you need them.",
    image: "/feat-analytics.png",
  },
  {
    id: "gates",
    navTitle: "Open The Gates",
    subtitle: "Launch in controlled waves",
    description:
      "When you're ready, invite top-ranked participants in targeted batches. Control your rollout pace with zero friction.",
    image: "/feat-gates.png",
  },
];

interface FeatureGridProps {
  className?: string;
}

export function FeatureGridSection({ className = "" }: FeatureGridProps) {
  const [activeId, setActiveId] = React.useState<FeatureId>("waitlist");
  const sectionRef = React.useRef<HTMLElement>(null);
  const slideRefs = React.useRef<Record<FeatureId, HTMLDivElement | null>>({
    waitlist: null,
    referrals: null,
    analytics: null,
    gates: null,
  });

  return (
    <section
      ref={sectionRef}
      className={cn("bg-[#f2f1ec] py-20 sm:py-28 relative", className)}
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ── Left Column: Sticky nav list ── */}
          <div className="lg:col-span-3 sticky top-32 space-y-1 py-1">
            {features.map((item) => {
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveId(item.id);
                    slideRefs.current[item.id]?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                  className="block w-full text-left py-0.5 outline-none"
                >
                  <span
                    className={cn(
                      "text-[22px] sm:text-[24px] leading-tight tracking-[-0.01em] transition-all duration-300",
                      isActive
                        ? "font-bold text-[#1a1a1a]"
                        : "font-normal text-[#a8a89a] hover:text-[#6e6e60]"
                    )}
                  >
                    {item.navTitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Right Column: Scrollable cards ── */}
          <div className="lg:col-span-9 space-y-6">
            {features.map((item) => (
              <motion.div
                key={item.id}
                ref={(el) => {
                  slideRefs.current[item.id] = el;
                }}
                onViewportEnter={() => setActiveId(item.id)}
                viewport={{ amount: 0.55 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="bg-[#e8e7e1] rounded-[20px] overflow-hidden"
              >
                {/* Inner grid: text left, image right */}
                <div className="grid grid-cols-12 min-h-[300px] sm:min-h-[320px]">

                  {/* Text area */}
                  <div className="col-span-12 sm:col-span-5 flex flex-col justify-start p-7 sm:p-8">
                    <p className="text-[13px] sm:text-[14px] font-semibold text-[#1a1a1a] leading-snug mb-1.5">
                      {item.subtitle}
                    </p>
                    <p className="text-[13px] sm:text-[14px] text-[#6e6e60] leading-[1.6] max-w-[260px]">
                      {item.description}
                    </p>
                  </div>

                  {/* Image area — flush right with rounded right corners */}
                  <div className="col-span-12 sm:col-span-7 relative overflow-hidden rounded-r-[20px]">
                    <img
                      src={item.image}
                      alt={item.navTitle}
                      className="w-full h-full object-cover object-left"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
