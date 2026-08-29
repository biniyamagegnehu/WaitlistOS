"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { DollarSign, Zap, Package, Users, ChevronRight, ShoppingCart } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingState } from "@/components/patterns/loading-state";
import { ErrorState } from "@/components/patterns/error-state";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { Badge } from "@/components/ui/badge";
import { getDashboardWaitlistDetail } from "@/services/dashboard";
import { api } from "@/lib/axios";

interface MonetizationOverview {
  skipLineEnabled: boolean;
  skipLineRevenue: number;
  skipLinePaidParticipants: number;
  preOrderEnabled: boolean;
  preOrderRevenue: number;
  preOrderDeposits: number;
  affiliateEnabled: boolean;
  affiliateEarnings: number;
  affiliateConversions: number;
}

export default function WaitlistMonetizationPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const waitlistId = params?.id as string;
  const [error, setError] = React.useState<string | null>(null);
  const [overview, setOverview] = React.useState<MonetizationOverview | null>(null);
  const [waitlist, setWaitlist] = React.useState<any>(null);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  React.useEffect(() => {
    if (!waitlistId) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const waitlistData = await getDashboardWaitlistDetail(waitlistId);
        setWaitlist(waitlistData.waitlist);

        // Fetch Skip the Line analytics
        try {
          const skipLineResponse = await api.get(`/monetization/skip-line/analytics/${waitlistId}`);
          setOverview({
            skipLineEnabled: skipLineResponse.data.skipLineEnabled || false,
            skipLineRevenue: skipLineResponse.data.totalRevenue || 0,
            skipLinePaidParticipants: skipLineResponse.data.paidParticipants || 0,
            preOrderEnabled: false,
            preOrderRevenue: 0,
            preOrderDeposits: 0,
            affiliateEnabled: false,
            affiliateEarnings: 0,
            affiliateConversions: 0,
          });
        } catch {
          setOverview({
            skipLineEnabled: false,
            skipLineRevenue: 0,
            skipLinePaidParticipants: 0,
            preOrderEnabled: false,
            preOrderRevenue: 0,
            preOrderDeposits: 0,
            affiliateEnabled: false,
            affiliateEarnings: 0,
            affiliateConversions: 0,
          });
        }
      } catch (err) {
        console.error("Failed to load monetization overview:", err);
        setError(getApiErrorMessage(err, "Failed to load monetization data"));
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [waitlistId]);

  if (isLoading || !isAuthenticated) {
    return (
      <PageContainer>
        <LoadingState variant="skeleton" skeletonCount={1} />
      </PageContainer>
    );
  }

  if (isLoadingData) {
    return (
      <PageContainer>
        <LoadingState variant="skeleton" skeletonCount={3} />
      </PageContainer>
    );
  }

  if (error && !overview) {
    return (
      <PageContainer>
        <ErrorState
          title="Failed to load monetization data"
          description={error}
          onHome={() => router.push(routes.waitlist(waitlistId))}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Monetization"
        description={`${waitlist?.name} - Revenue and monetization features`}
        breadcrumbs={[
          { label: "Waitlists", href: routes.waitlists },
          { label: waitlist?.name || "Waitlist", href: routes.waitlist(waitlistId) },
          { label: "Monetization" },
        ]}
      />

      {error && (
        <Alert variant="error" title="Error" className="mb-6">
          {error}
        </Alert>
      )}

        {overview && (
          <div className="space-y-6">
            {/* Skip the Line Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Skip the Line
                  </CardTitle>
                  <Badge variant={overview.skipLineEnabled ? "success" : "outline"}>
                    {overview.skipLineEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-muted mb-2">
                      Allow participants to pay for priority placement in your waitlist.
                    </p>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-text-muted">Revenue: </span>
                        <span className="font-medium">${overview.skipLineRevenue.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Paid: </span>
                        <span className="font-medium">{overview.skipLinePaidParticipants}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(routes.waitlistMonetizationSkipLine(waitlistId))}
                  >
                    Manage
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push(routes.waitlistMonetizationPreOrder(waitlistId))}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-surface-muted">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-text-primary mb-1">Pre-Order Deposit</h3>
                    <p className="text-text-muted text-sm">
                      Allow participants to secure their spot by placing a monetary deposit. Great for physical products or high-ticket services.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Affiliate Program Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-info" />
                    Affiliate Program
                  </CardTitle>
                  <Badge variant="outline">Coming soon</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-muted mb-2">
                      Turn your WaitlistOS experience into a referral channel.
                    </p>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-text-muted">Earnings: </span>
                        <span className="font-medium">${overview.affiliateEarnings.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Conversions: </span>
                        <span className="font-medium">{overview.affiliateConversions}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    disabled
                    onClick={() => router.push(routes.waitlistMonetizationAffiliate(waitlistId))}
                  >
                    Coming soon
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </PageContainer>
  );
}