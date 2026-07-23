"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface ProductShowcaseProps {
  image: React.ReactNode;
  title: string;
  description: string;
  features?: string[];
  reverse?: boolean;
  className?: string;
}

export function ProductShowcase({ 
  image, 
  title, 
  description, 
  features = [], 
  reverse = false,
  className = "" 
}: ProductShowcaseProps) {
  return (
    <div className={cn("grid gap-12 lg:grid-cols-2 lg:gap-20 items-center", className)}>
      <div className={cn("order-2 lg:order-1", reverse && "lg:order-2")}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <div className="relative rounded-2xl border border-border bg-background p-4 shadow-2xl">
            <div className="overflow-hidden rounded-xl">
              {image}
            </div>
          </div>
          {/* Floating decoration */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-4 -top-4 hidden h-24 w-24 rounded-2xl bg-primary/10 lg:block"
          />
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-4 -left-4 hidden h-16 w-16 rounded-xl bg-accent/10 lg:block"
          />
        </motion.div>
      </div>

      <div className={cn("order-1 lg:order-2", reverse && "lg:order-1")}>
        <motion.div
          initial={{ opacity: 0, x: reverse ? 30 : -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
          {features.length > 0 && (
            <ul className="space-y-3">
              {features.map((feature, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: reverse ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 text-muted-foreground"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  {feature}
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}

interface DashboardMockupProps {
  variant?: "analytics" | "waitlist" | "referrals" | "gates";
}

export function DashboardMockup({ variant = "analytics" }: DashboardMockupProps) {
  return (
    <div className="rounded-lg bg-surface p-6">
      {/* Browser header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="ml-4 flex-1 rounded-md bg-background px-3 py-1.5 text-xs text-muted-foreground">
          waitlistos.com/dashboard
        </div>
      </div>

      {/* Dashboard content */}
      <div className="space-y-4">
        {variant === "analytics" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Signups", value: "12,847", change: "+23.5%" },
                { label: "Referrals", value: "4,234", change: "+18.3%" },
                { label: "Conversion Rate", value: "34.2%", change: "+7.1%" },
                { label: "Viral Coefficient", value: "1.8x", change: "+0.3" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-lg bg-background p-4"
                >
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</div>
                  {stat.change && (
                    <div className="mt-1 flex items-center text-xs text-green-600">
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      {stat.change}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            <div className="rounded-lg bg-background p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">Waitlist Growth (Last 30 Days)</div>
              </div>
              <div className="flex h-32 items-end gap-2">
                {[25, 35, 30, 45, 40, 55, 50, 65, 60, 75, 70, 85].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex-1 rounded-t bg-primary/20"
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                <span>Day 1</span>
                <span>Day 30</span>
              </div>
            </div>
          </>
        )}

        {variant === "waitlist" && (
          <>
            <div className="rounded-lg bg-background p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">My Waitlists</div>
                <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                  + New Waitlist
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { name: "SaaS Product Launch", participants: "8,547", status: "Active" },
                  { name: "Mobile App Beta", participants: "3,234", status: "Active" },
                  { name: "Early Access Program", participants: "1,856", status: "Draft" },
                ].map((waitlist, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between rounded-lg bg-surface p-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">{waitlist.name}</div>
                      <div className="text-xs text-muted-foreground">{waitlist.participants} participants</div>
                    </div>
                    <div className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {waitlist.status}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}

        {variant === "referrals" && (
          <>
            <div className="rounded-lg bg-background p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">Referral Leaderboard</div>
                <div className="text-xs text-muted-foreground">Top 5</div>
              </div>
              <div className="space-y-2">
                {[
                  { email: "sarah@techstartup.io", referrals: 47, position: "#1" },
                  { email: "mike@producthunt.com", referrals: 38, position: "#2" },
                  { email: "jess@indiehackers.co", referrals: 29, position: "#3" },
                  { email: "alex@saaslab.io", referrals: 24, position: "#4" },
                  { email: "emma@launch.co", referrals: 19, position: "#5" },
                ].map((user, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between rounded-lg bg-surface p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {user.position}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{user.email}</div>
                        <div className="text-xs text-muted-foreground">{user.referrals} referrals</div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-accent">{user.position}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}

        {variant === "gates" && (
          <>
            <div className="rounded-lg bg-background p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">Open The Gates</div>
                <div className="text-xs text-muted-foreground">Select participants</div>
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between rounded-lg bg-surface p-3"
                  >
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="h-4 w-4 rounded border-border" />
                      <div>
                        <div className="text-sm font-medium text-foreground">user{i}@example.com</div>
                        <div className="text-xs text-muted-foreground">Position #{i * 10}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Referrals: {10 - i}</div>
                  </motion.div>
                ))}
              </div>
              <button className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground">
                Invite Selected (5)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
