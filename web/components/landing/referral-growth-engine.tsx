"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { DashboardMockup } from "@/components/landing/product-showcase";

export function ReferralGrowthEngine() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const features = [
    {
      title: "Unique referral links",
      description: "Every user gets a personalized link instantly.",
      icon: "🔗"
    },
    {
      title: "Real-time leaderboard",
      description: "Drive competition with live rankings.",
      icon: "🏆"
    },
    {
      title: "Automatic position updates",
      description: "No manual work. System handles it all.",
      icon: "⚡"
    },
    {
      title: "Customizable reward tiers",
      description: "Set milestones to unlock exclusive perks.",
      icon: "🎁"
    }
  ];

  return (
    <section 
      ref={containerRef}
      className="relative py-16 sm:py-24 overflow-hidden flex items-center justify-center bg-surface text-foreground"
      id="referral-engine"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-accent/20 blur-[150px] mix-blend-screen" />
        
        {/* Animated grid */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03] opacity-10" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23888888' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 text-sm font-medium"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Growth Engine
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            Viral Referral <br className="hidden sm:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Growth Engine
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mb-8 text-lg leading-relaxed text-muted-foreground"
          >
            Every participant gets a unique referral link. When they share it and friends sign up, they move up the waitlist and unlock exclusive rewards.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Features Left */}
          <motion.div style={{ y: y1 }} className="lg:col-span-3 space-y-6 hidden lg:block">
            {features.slice(0, 2).map((feature, i) => (
              <FeatureCard key={i} feature={feature} align="left" />
            ))}
          </motion.div>

          {/* Center Image */}
          <motion.div 
            initial={{ opacity: 0, y: 50, rotateX: 20 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            style={{ opacity }}
            className="lg:col-span-6 relative perspective-[2000px]"
          >
             <div className="relative rounded-2xl p-1 bg-gradient-to-b from-foreground/5 to-transparent">
               <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-2xl -z-10 rounded-full" />
               <div className="bg-background rounded-xl overflow-hidden shadow-2xl border border-border">
                 <DashboardMockup variant="referrals" />
               </div>
             </div>
          </motion.div>

          {/* Features Right */}
          <motion.div style={{ y: y1 }} className="lg:col-span-3 space-y-6 hidden lg:block">
            {features.slice(2, 4).map((feature, i) => (
              <FeatureCard key={i + 2} feature={feature} align="left" />
            ))}
          </motion.div>

          {/* Features Mobile (Grid) */}
          <div className="col-span-full grid sm:grid-cols-2 gap-6 lg:hidden mt-8">
            {features.map((feature, i) => (
              <FeatureCard key={i} feature={feature} align="left" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, align }: { feature: any, align: 'left' | 'right' }) {
  return (
    <div className={`
      relative p-6 rounded-2xl bg-background/50 border border-border backdrop-blur-sm
      hover:bg-foreground/5 transition-colors duration-300 group flex flex-col justify-center min-h-[220px]
      ${align === 'right' ? 'lg:text-right' : 'lg:text-left'}
    `}>
      <div className={`
        w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl mb-4
        ${align === 'right' ? 'lg:ml-auto' : ''}
        group-hover:scale-110 transition-transform duration-300
      `}>
        {feature.icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}
