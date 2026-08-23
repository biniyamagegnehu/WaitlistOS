"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeft, DollarSign, Zap, Package, Users, ChevronRight, ShoppingCart } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingScreen } from "@/components/layouts/loading-screen";
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
    return <LoadingScreen />;
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-foreground">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <Alert variant="error" title="Error">
            {error}
          </Alert>
          <Button
            onClick={() => router.push(routes.waitlist(waitlistId))}
            className="mt-4"
          >
            Back to Waitlist
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(routes.waitlist(waitlistId))}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Waitlist
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              Monetization
            </h1>
            <p className="mt-2 text-muted-foreground">
              {waitlist?.name} - Revenue and monetization features
            </p>
          </div>
        </div>

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
                    <p className="text-sm text-muted-foreground mb-2">
                      Allow participants to pay for priority placement in your waitlist.
                    </p>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Revenue: </span>
                        <span className="font-medium">${overview.skipLineRevenue.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Paid: </span>
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
              onClick={() => router.push(routes.waitlistMonetization(waitlistId) + "/pre-order")}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-surface-muted">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">Pre-Order Deposit</h3>
                    <p className="text-muted-foreground text-sm">
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
                    <p className="text-sm text-muted-foreground mb-2">
                      Turn your WaitlistOS experience into a referral channel.
                    </p>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Earnings: </span>
                        <span className="font-medium">${overview.affiliateEarnings.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conversions: </span>
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
      </div>
    </div>
  );
}