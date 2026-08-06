import React from "react";
import Link from "next/link";
import { DashboardWaitlist } from "@/types/dashboard";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, XCircle } from "lucide-react";

interface GrowthSummaryCardProps {
  waitlistId: string;
  waitlist: DashboardWaitlist;
}

export function GrowthSummaryCard({ waitlistId, waitlist }: GrowthSummaryCardProps) {
  const features = [
    { name: "Double-Sided Rewards", enabled: waitlist.doubleSidedRewardsEnabled },
    { name: "Streak Bonuses", enabled: waitlist.streakBonusesEnabled },
    { name: "Team Referrals", enabled: waitlist.teamReferralsEnabled },
    { name: "Urgency Engine", enabled: waitlist.urgencyEnabled },
  ];

  const enabledCount = features.filter((f) => f.enabled).length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Growth Engine</CardTitle>
        <CardDescription>
          Manage referral growth and conversion features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-foreground">Features Enabled</h4>
            <span className="text-sm font-medium text-muted-foreground">{enabledCount} / 4</span>
          </div>
          
          <div className="space-y-2">
            {features.map((feature, idx) => (
              <div key={idx} className="flex justify-between items-center rounded-lg border border-border bg-surface p-3">
                <span className="text-sm font-medium text-foreground">{feature.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${feature.enabled ? "text-success" : "text-muted-foreground"}`}>
                    {feature.enabled ? "Enabled" : "Disabled"}
                  </span>
                  {feature.enabled ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href={routes.waitlistGrowth(waitlistId)} className="block">
          <Button className="w-full">
            Manage Growth Engine <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
