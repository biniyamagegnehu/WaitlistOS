"use client";

import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { DollarSign, ArrowRight, Zap, Package, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import { Alert } from "@/components/ui/alert";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { api } from "@/lib/axios";

interface WaitlistMonetizationSummary {
  id: string;
  name: string;
  slug: string;
  totalParticipants: number;
  skipLineEnabled: boolean;
  skipLineRevenue: number;
  skipLinePaidParticipants: number;
}

export default function MonetizationPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [summaries, setSummaries] = React.useState<WaitlistMonetizationSummary[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  React.useEffect(() => {
    const fetchMonetizationSummaries = async () => {
      try {
        const response = await api.get('/dashboard/waitlists');
        const waitlists = response.data || [];
        
        // Fetch monetization data for each waitlist
        const summariesWithMonetization = await Promise.all(
          waitlists.map(async (waitlist: any) => {
            try {
              const monetizationResponse = await api.get(`/monetization/skip-line/analytics/${waitlist.id}`);
              return {
                id: waitlist.id,
                name: waitlist.name,
                slug: waitlist.slug,
                totalParticipants: waitlist.totalParticipants || 0,
                skipLineEnabled: monetizationResponse.data.skipLineEnabled || false,
                skipLineRevenue: monetizationResponse.data.totalRevenue || 0,
                skipLinePaidParticipants: monetizationResponse.data.paidParticipants || 0,
              };
            } catch {
              return {
                id: waitlist.id,
                name: waitlist.name,
                slug: waitlist.slug,
                totalParticipants: waitlist.totalParticipants || 0,
                skipLineEnabled: false,
                skipLineRevenue: 0,
                skipLinePaidParticipants: 0,
              };
            }
          })
        );
        
        setSummaries(summariesWithMonetization);
      } catch (err) {
        console.error("Failed to fetch monetization summaries:", err);
        setError(getApiErrorMessage(err, "Failed to load monetization data"));
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchMonetizationSummaries();
  }, []);

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

  if (error && summaries.length === 0) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        </div>
      </div>
    );
  }

  const totalRevenue = summaries.reduce((sum, s) => sum + s.skipLineRevenue, 0);
  const totalPaidParticipants = summaries.reduce((sum, s) => sum + s.skipLinePaidParticipants, 0);
  const activeSkipLineCount = summaries.filter(s => s.skipLineEnabled).length;

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Monetization
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage revenue streams across all your waitlists
          </p>
        </div>

        {error && (
          <Alert variant="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-success" />
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              </div>
              <p className="text-3xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Paid Participants</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{totalPaidParticipants}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-warning" />
                <p className="text-sm font-medium text-muted-foreground">Active Skip the Line</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{activeSkipLineCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Waitlist Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Your Waitlists</h2>
          
          {summaries.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No waitlists yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first waitlist to start monetizing.
                </p>
                <Button onClick={() => router.push(routes.create)}>
                  Create Waitlist
                </Button>
              </CardContent>
            </Card>
          ) : (
            summaries.map((summary) => (
              <Card key={summary.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{summary.name}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(routes.waitlistMonetization(summary.id))}
                    >
                      Manage
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                      <p className="text-2xl font-bold text-foreground">{summary.totalParticipants}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Skip the Line</p>
                      <p className="text-sm text-foreground">
                        {summary.skipLineEnabled ? (
                          <span className="text-success">Enabled</span>
                        ) : (
                          <span className="text-muted-foreground">Disabled</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold text-foreground">${summary.skipLineRevenue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Paid Participants</p>
                      <p className="text-2xl font-bold text-foreground">{summary.skipLinePaidParticipants}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Feature Overview */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">Monetization Features</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Skip the Line
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Allow participants to pay for priority placement in your waitlist.
                </p>
                <div className="text-sm">
                  <span className="text-success font-medium">Available</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-warning" />
                  Pre-Order Deposit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Collect deposits from participants to validate purchase intent.
                </p>
                <div className="text-sm">
                  <span className="text-muted-foreground">Coming soon</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-info" />
                  Affiliate Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Turn your WaitlistOS experience into a referral channel.
                </p>
                <div className="text-sm">
                  <span className="text-muted-foreground">Coming soon</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}