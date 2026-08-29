"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Package, Clock } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/patterns/loading-state";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { Badge } from "@/components/ui/badge";

export default function PreOrderDepositPage() {
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
      <PageHeader
        title="Pre-Order Deposit"
        description="Collect deposits from participants to validate purchase intent"
        breadcrumbs={[
          { label: "Waitlists", href: routes.waitlists },
          { label: "Waitlist", href: routes.waitlist(waitlistId) },
          { label: "Monetization", href: routes.waitlistMonetization(waitlistId) },
          { label: "Pre-Order Deposit" },
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
            <Package className="h-16 w-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Pre-Order Deposit Feature
            </h3>
            <p className="text-text-muted mb-6 max-w-md mx-auto">
              Allow participants to place deposits to secure their spot in your waitlist and validate their purchase intent. This feature will help you identify serious buyers and reduce drop-offs.
            </p>
            <div className="space-y-2 text-left max-w-md mx-auto mb-6">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-2 rounded-full bg-text-muted" />
                <p className="text-sm text-text-muted">
                  Collect deposits for pre-order product launches
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-2 rounded-full bg-text-muted" />
                <p className="text-sm text-text-muted">
                  Set deposit amounts and payment terms
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-2 rounded-full bg-text-muted" />
                <p className="text-sm text-text-muted">
                  Track deposit status and collection progress
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-2 rounded-full bg-text-muted" />
                <p className="text-sm text-text-muted">
                  Integrate with Stripe and Chapa payments
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(routes.monetization)}
            >
              Back to Monetization Overview
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}