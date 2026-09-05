"use client";

import { useEffect, useState } from "react";
import { affiliateService, AffiliateDashboardResponse } from "@/services/affiliates";
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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://getlist.com";

export function AffiliateSection() {
  const [data, setData] = useState<AffiliateDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const dashboardData = await affiliateService.getDashboard();
      setData(dashboardData);
    } catch (err: any) {
      console.error('Affiliate dashboard load error:', err);
      
      // Provide specific error messages based on error type
      let errorMessage = "Failed to load affiliate data.";
      
      if (err?.response?.status === 401) {
        errorMessage = "Please log in to view your affiliate dashboard.";
      } else if (err?.response?.status === 403) {
        errorMessage = "You don't have permission to access the affiliate program.";
      } else if (err?.response?.status === 404) {
        errorMessage = "Affiliate program not found. Please contact support.";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      
      // Set data to null to show error state
      setData(null);
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
    }).catch((err) => {
      console.error('Failed to copy affiliate link:', err);
      toast.error("Failed to copy link. Please try again.");
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <Network className="h-12 w-12 text-muted-foreground opacity-50" />
        <div>
          <p className="font-medium">Affiliate Program Unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We couldn&apos;t load your affiliate account. Please try again later or contact support if the problem persists.
          </p>
        </div>
        <Button onClick={loadDashboard} disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Retrying...
            </>
          ) : (
            "Retry"
          )}
        </Button>
      </div>
    );
  }

  const affiliateLink = `${APP_URL}/?ref=${data.affiliate.code}`;
  const formatCurrency = (amount: number, currency: string = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  return (
    <div className="space-y-6 pt-4">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {data.affiliate.status === "ACTIVE" 
              ? `Share your link and earn ${(Number(data.affiliate.commissionRate) * 100).toFixed(0)}% commission on every paid referral.`
              : "Your affiliate account is currently inactive. Contact support for more information."
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={data.affiliate.status === "ACTIVE" ? "success" : "default"}>
            {data.affiliate.status}
          </Badge>
          {data.affiliate.status === "ACTIVE" && (
            <Badge variant="outline" className="bg-primary/5 text-primary">
              {(Number(data.affiliate.commissionRate) * 100).toFixed(0)}% Commission
            </Badge>
          )}
        </div>
      </div>

      {/* Affiliate Link - Only show for active affiliates */}
      {data.affiliate.status === "ACTIVE" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">Your Affiliate Link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded-md border bg-background px-3 py-2 font-mono text-sm text-foreground/80 select-all">
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
              Share this permanent link. Clicks, sign-ups, and conversions are tracked automatically.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Inactive Account Message */}
      {data.affiliate.status !== "ACTIVE" && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <span className="text-amber-600 dark:text-amber-400">⚠️</span>
              </div>
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">Account Inactive</p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                  Your affiliate account is currently {data.affiliate.status}. Please contact support if you believe this is an error.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats - Only show for active affiliates */}
      {data.affiliate.status === "ACTIVE" && (
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
                {formatCurrency(data.stats.pendingBalance)} pending (14-day settlement window) · {formatCurrency(data.stats.paidOut)} paid out
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sub-tabs - Only show for active affiliates */}
      {data.affiliate.status === "ACTIVE" && (
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList>
            <TabsTrigger value="performance">
              <TrendingUp className="mr-2 h-3.5 w-3.5" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="payouts">
              <CreditCard className="mr-2 h-3.5 w-3.5" />
              Payouts &amp; Settings
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
      )}
    </div>
  );
}
