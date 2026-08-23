"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeft, Zap, TrendingUp, DollarSign, Users } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import { getDashboardWaitlistDetail } from "@/services/dashboard";
import { api } from "@/lib/axios";
import { monetizationService } from "@/services/monetization";

interface SkipLineAnalytics {
  paidParticipants: number;
  totalRevenue: number;
  platformFees: number;
  founderRevenue: number;
  currency: string;
  skipLineEnabled: boolean;
  skipLinePrice: number | null;
}

export default function SkipLinePage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const waitlistId = params?.id as string;
  const [error, setError] = React.useState<string | null>(null);
  const [analytics, setAnalytics] = React.useState<SkipLineAnalytics | null>(null);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  React.useEffect(() => {
    if (!waitlistId) return;

    const fetchAnalytics = async () => {
      try {
        const waitlistData = await getDashboardWaitlistDetail(waitlistId);
        
        // Calculate Skip the Line analytics
        const monetizationPayments = await api.get(`/monetization/payments?waitlistId=${waitlistId}&paymentType=SKIP_LINE&status=SUCCEEDED`);
        
        const payments = monetizationPayments.data || [];
        const paidParticipants = payments.length;
        const totalRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const platformFees = payments.reduce((sum: number, p: any) => sum + Number(p.platformFee), 0);
        const founderRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.founderAmount), 0);

        setAnalytics({
          paidParticipants,
          totalRevenue,
          platformFees,
          founderRevenue,
          currency: payments[0]?.currency || "USD",
          skipLineEnabled: waitlistData.waitlist.skipLineEnabled || false,
          skipLinePrice: waitlistData.waitlist.skipLinePrice ?? null,
        });
      } catch (err) {
        console.error("Failed to fetch Skip the Line analytics:", err);
        setError(getApiErrorMessage(err, "Failed to load analytics"));
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAnalytics();
  }, [waitlistId]);

  const handleToggleSkipLine = async () => {
    if (!analytics) return;
    
    setIsUpdating(true);
    setError(null);

    try {
      await api.patch(`/waitlists/${waitlistId}`, {
        skipLineEnabled: !analytics.skipLineEnabled,
      });
      
      // Refresh analytics
      window.location.reload();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update Skip the Line settings"));
      setIsUpdating(false);
    }
  };

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

  if (error && !analytics) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-8 w-8 text-primary" />
                Skip the Line
              </h1>
              <p className="mt-2 text-muted-foreground">
                Monetization analytics and configuration
              </p>
            </div>
            <Button
              onClick={handleToggleSkipLine}
              disabled={isUpdating}
              variant={analytics?.skipLineEnabled ? "destructive" : "primary"}
            >
              {isUpdating ? "Updating..." : analytics?.skipLineEnabled ? "Disable Skip the Line" : "Enable Skip the Line"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}

        {analytics && (
          <div className="space-y-6">
            {/* Status Card */}
            <Card className={analytics.skipLineEnabled ? "border-success/20 bg-success/5" : "border-border"}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${analytics.skipLineEnabled ? "bg-success/20" : "bg-muted"}`}>
                      <Zap className={`h-5 w-5 ${analytics.skipLineEnabled ? "text-success" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {analytics.skipLineEnabled ? "Skip the Line is Enabled" : "Skip the Line is Disabled"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {analytics.skipLineEnabled
                          ? `Participants can pay $${analytics.skipLinePrice?.toFixed(2) || "10.00"} to move into the top 10%`
                          : "Enable Skip the Line to allow participants to pay for priority placement"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {analytics.skipLinePrice ? `$${analytics.skipLinePrice.toFixed(2)}` : "$10.00"}
                    </p>
                    <p className="text-xs text-muted-foreground">Price per participant</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">Paid Participants</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{analytics.paidParticipants}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-success" />
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {analytics.currency === "USD" ? "$" : ""}{analytics.totalRevenue.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-warning" />
                    <p className="text-sm font-medium text-muted-foreground">Platform Fees</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {analytics.currency === "USD" ? "$" : ""}{analytics.platformFees.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">Founder Revenue</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {analytics.currency === "USD" ? "$" : ""}{analytics.founderRevenue.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">How Skip the Line Works</h3>
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Paid Priority Pool</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Participants who purchase Skip the Line enter the paid priority pool</li>
                      <li>• All paid participants appear above all normal participants</li>
                      <li>• Within the paid pool, ranking is still determined by referral score</li>
                      <li>• Platform fee is 5% of each transaction</li>
                      <li>• Participants can only purchase Skip the Line once</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}