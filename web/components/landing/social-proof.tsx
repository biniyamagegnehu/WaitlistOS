"use client";

import { motion } from "framer-motion";
import { SlideUp } from "./scroll-animations";

export function SocialProof() {
  return (
    <section className="bg-surface py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SlideUp>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Trusted by founders worldwide
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { name: "TechStart", users: "2.5K" },
                { name: "LaunchPad", users: "1.8K" },
                { name: "GrowthLab", users: "3.2K" },
                { name: "Innovate", users: "1.5K" },
                { name: "ScaleUp", users: "2.1K" },
              ].map((company, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-primary/20" />
                  </div>
                  <div className="text-sm font-medium text-foreground">{company.name}</div>
                  <div className="text-xs text-muted-foreground">{company.users} users</div>
                </motion.div>
              ))}
            </div>
          </div>
        </SlideUp>
      </div>
    </section>
  );
}
