"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Users, Clock } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/patterns/loading-state";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/navigation/back-button";

export default function AffiliateProgramPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const waitlistId = params?.id as string;

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <PageContainer>
        <LoadingState variant="skeleton" skeletonCount={1} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton href={routes.waitlistMonetization(waitlistId)} label="Back to Monetization" className="mb-4" />
      <PageHeader
        title="Affiliate Program"
        description="Turn your WaitlistOS experience into a referral channel"
        breadcrumbs={[
          { label: "Waitlists", href: routes.waitlists },
          { label: "Waitlist", href: routes.waitlist(waitlistId) },
          { label: "Monetization", href: routes.waitlistMonetization(waitlistId) },
          { label: "Affiliate Program" },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Coming Soon</CardTitle>
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              In Development
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Affiliate Program Feature
            </h3>
            <p className="text-text-muted mb-6 max-w-md mx-auto">
              Create an affiliate program to incentivize users to promote your waitlist. Track referrals, manage commissions, and grow your community through word-of-mouth marketing.
            </p>
            <div className="space-y-2 text-left max-w-md mx-auto mb-6">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-2 rounded-full bg-text-muted" />
                <p className="text-sm text-text-muted">
                  Set commission rates and payout structures
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-2 rounded-full bg-text-muted" />
                <p className="text-sm text-text-muted">
                  Generate unique affiliate links and codes
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-2 rounded-full bg-text-muted" />
                <p className="text-sm text-text-muted">
                  Track clicks, conversions, and earnings
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-2 rounded-full bg-text-muted" />
                <p className="text-sm text-text-muted">
                  Manage affiliate payouts and reports
                </p>
              </div>
            </div>
            <BackButton
              variant="outline"
              href={routes.monetization}
              label="Back to Monetization Overview"
              className="justify-center"
            />
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}