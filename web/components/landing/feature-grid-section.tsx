"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface FeatureGridProps {
  features: Array<{
    title: string;
    description: string;
    icon?: React.ReactNode;
  }>;
  rightContent?: React.ReactNode;
  className?: string;
}

export function FeatureGridSection({ features, rightContent, className = "" }: FeatureGridProps) {
  return (
    <section className={cn("py-16 sm:py-24", className)}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left side - Feature Grid */}
          <div className="space-y-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="flex items-start gap-4">
                  {feature.icon && (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right side - Marketing Content */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="sticky top-8"
            >
              {rightContent || (
                <div className="relative rounded-2xl border border-border bg-surface p-4 shadow-2xl">
                  <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">Image Placeholder</div>
                      <div className="mt-2 text-sm text-muted-foreground">Replace with actual image</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
