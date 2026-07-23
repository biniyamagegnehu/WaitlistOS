"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface Feature {
  id: string;
  navTitle: string;
  subtitle: string;
  description: string;
  image: string;
}

const features: Feature[] = [
  {
    id: "waitlist",
    navTitle: "Waitlist Management",
    subtitle: "Set once, then launch",
    description:
      "Keep your audience organized with branded signup flows that show positions, milestones and real-time updates — automatically.",
    image: "/feat-waitlist.png",
  },
  {
    id: "referral",
    navTitle: "Referral System",
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

export function CoreCapabilities() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    const handleScroll = () => {
      let closestIndex = 0;
      let closestDistance = Infinity;
      const center = window.innerHeight / 2;

      cardRefs.current.forEach((ref, i) => {
        if (!ref) return;
        const rect = ref.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      });
      setActiveIndex(closestIndex);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToCard = (index: number) => {
    const el = cardRefs.current[index];
    if (!el) return;
    const top =
      el.getBoundingClientRect().top +
      window.scrollY -
      window.innerHeight / 2 +
      el.offsetHeight / 2;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section
      className="bg-surface-muted py-20 sm:py-28 relative"
      id="core-capabilities"
    >
      <div className="mx-auto max-w-[1100px] px-6 sm:px-10 lg:px-12">
        <div className="flex gap-12 lg:gap-16 items-start">

          {/* ── Left: Sticky bare typography list ── */}
          <div className="hidden lg:flex flex-col gap-1 sticky top-[35vh] min-w-[200px] w-[200px] flex-shrink-0">
            {features.map((feature, i) => (
              <button
                key={feature.id}
                onClick={() => scrollToCard(i)}
                className="text-left py-1 outline-none"
              >
                <span
                  className={cn(
                    "block text-[20px] leading-tight tracking-[-0.01em] transition-all duration-300",
                    activeIndex === i
                      ? "font-bold text-foreground"
                      : "font-normal text-muted-foreground/40 hover:text-muted-foreground"
                  )}
                >
                  {feature.navTitle}
                </span>
              </button>
            ))}
          </div>

          {/* ── Right: Scrollable feature cards ── */}
          <div className="flex-1 flex flex-col gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.id}
                ref={(el) => { cardRefs.current[i] = el; }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.5 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-[18px] bg-surface border border-border"
                style={{ minHeight: 280 }}
              >
                {/* Card Inner: text left, image right */}
                <div className="flex h-full min-h-[280px]">

                  {/* Text block — left ~38% */}
                  <div className="flex flex-col justify-start px-8 py-8 sm:px-10 sm:py-10 w-[38%] flex-shrink-0">
                    <p className="text-[13.5px] font-semibold text-foreground mb-1.5 leading-snug">
                      {feature.subtitle}
                    </p>
                    <p className="text-[13.5px] text-muted-foreground leading-[1.65] max-w-[230px]">
                      {feature.description}
                    </p>
                  </div>

                  {/* Image block — right ~62%, flush right + top + bottom */}
                  <div className="flex-1 relative overflow-hidden rounded-r-[18px]">
                    <img
                      src={feature.image}
                      alt={feature.navTitle}
                      className="w-full h-full object-cover object-left-top"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>

      {/* Mobile dot navigation */}
      <div className="mt-8 flex justify-center gap-2 lg:hidden">
        {features.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToCard(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              activeIndex === i
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </section>
  );
}
