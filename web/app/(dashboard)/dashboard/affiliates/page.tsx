"use client";

import { useEffect, useState } from "react";
import { affiliateService, AffiliateDashboardResponse } from "@/services/affiliates";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Network,
  ArrowUpRight,
  DollarSign,
  Copy,
  Check,
  MousePointerClick,
  Users,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import { AffiliatePayoutsTab } from "@/components/dashboard/affiliates/affiliate-payouts-tab";
import { AffiliatePerformanceTab } from "@/components/dashboard/affiliates/affiliate-performance-tab";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://waitlistos.com";

export default function AffiliatesPage() {
  const [data, setData] = useState<AffiliateDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const dashboardData = await affiliateService.getDashboard();
      setData(dashboardData);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to load affiliate data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCopyLink = () => {
    if (!data) return;
    const link = `${APP_URL}/?ref=${data.affiliate.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success("Affiliate link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) return <LoadingScreen />;

  if (!data) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <Network className="h-12 w-12 text-muted-foreground opacity-50" />
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Affiliate Program Unavailable</h2>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load your affiliate account. Please try again later.
          </p>
        </div>
        <Button onClick={loadDashboard}>Retry</Button>
      </div>
    );
  }

  const affiliateLink = `${APP_URL}/?ref=${data.affiliate.code}`;

  const formatCurrency = (amount: number, currency: string = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Affiliate Program</h1>
          <p className="text-sm text-muted-foreground">
            Share your link, earn {(Number(data.affiliate.commissionRate) * 100).toFixed(0)}% commission on every paid referral.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={data.affiliate.status === "ACTIVE" ? "success" : "default"}>
            {data.affiliate.status}
          </Badge>
          <Badge variant="outline" className="bg-primary/5 text-primary">
            {(Number(data.affiliate.commissionRate) * 100).toFixed(0)}% Commission
          </Badge>
        </div>
      </div>

      {/* Affiliate Link — always visible */}
      <Card className="border-primary/20 bg-primary/5 dark:bg-primary/5">
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-medium text-foreground">Your Affiliate Link</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm text-foreground/80 truncate select-all">
              {affiliateLink}
            </div>
            <Button
              id="copy-affiliate-link-btn"
              variant="primary"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0 gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Share this permanent link. Clicks, sign-ups, and conversions are all tracked automatically.
          </p>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.affiliate.clickCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total link visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.referredCount}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.convertedCount} paid · {data.stats.conversionRate}% conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available to Payout</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.stats.eligibleBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Ready for next payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.stats.totalEarned)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(data.stats.pendingBalance)} pending · {formatCurrency(data.stats.paidOut)} paid out
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">
            <TrendingUp className="mr-2 h-3.5 w-3.5" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="payouts">
            <CreditCard className="mr-2 h-3.5 w-3.5" />
            Payouts & Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <AffiliatePerformanceTab
            conversions={data.conversions}
            commissions={data.recentCommissions}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="payouts">
          <AffiliatePayoutsTab
            paymentAccounts={data.paymentAccounts}
            preferredPayoutProvider={data.affiliate.preferredPayoutProvider}
            payouts={data.recentPayouts}
            formatCurrency={formatCurrency}
            onPreferenceUpdated={loadDashboard}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
