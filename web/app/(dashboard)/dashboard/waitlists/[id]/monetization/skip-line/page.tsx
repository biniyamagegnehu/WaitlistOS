"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeft, Zap, TrendingUp, DollarSign, Users, CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHeadCell, TableRow } from "@/components/ui/table";
import { getDashboardWaitlistDetail } from "@/services/dashboard";
import { api } from "@/lib/axios";

interface SkipLineAnalytics {
  paidParticipants: number;
  totalRevenue: number | string;
  platformFees: number | string;
  providerFees: number | string;
  founderRevenue: number | string;
  averagePayment: number;
  currency: string;
  skipLineEnabled: boolean;
  skipLinePrice: number | string | null;
  skipLineCurrency: string | null;
  byProvider: {
    stripe?: {
      totalRevenue: number | string;
      paidParticipants: number;
      platformFees: number | string;
      providerFees: number | string;
      founderRevenue: number | string;
    };
    chapa?: {
      totalRevenue: number | string;
      paidParticipants: number;
      platformFees: number | string;
      providerFees: number | string;
      founderRevenue: number | string;
    };
  };
}

interface Transaction {
  id: string;
  paymentType: string;
  amount: number | string;
  currency: string;
  platformFee: number | string;
  providerFee: number | string;
  founderAmount: number | string;
  status: string;
  provider: string;
  providerPaymentId: string;
  createdAt: string;
  updatedAt: string;
  participant: {
    id: string;
    email: string;
    position: number;
    hasSkipLinePriority: boolean;
  };
  waitlist: {
    id: string;
    name: string;
    slug: string;
  };
}

interface TransactionsResponse {
  payments: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function SkipLinePage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const waitlistId = params?.id as string;
  const [error, setError] = React.useState<string | null>(null);
  const [analytics, setAnalytics] = React.useState<SkipLineAnalytics | null>(null);
  const [transactions, setTransactions] = React.useState<TransactionsResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [showConfig, setShowConfig] = React.useState(false);
  
  // Config form states
  const [configPrice, setConfigPrice] = React.useState("");
  const [configCurrency, setConfigCurrency] = React.useState("USD");
  const [isSavingConfig, setIsSavingConfig] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchAnalytics = async (filters: any = {}) => {
    try {
      const waitlistData = await getDashboardWaitlistDetail(waitlistId);
      
      // Fetch enhanced analytics from backend
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, String(value));
      });
      
      const analyticsResponse = await api.get(`/monetization/skip-line/analytics/${waitlistId}?${queryParams}`);
      setAnalytics(analyticsResponse.data);
      
      // Set config form values
      if (analyticsResponse.data.skipLinePrice) {
        setConfigPrice(Number(analyticsResponse.data.skipLinePrice).toString());
      }
      if (analyticsResponse.data.skipLineCurrency) {
        setConfigCurrency(analyticsResponse.data.skipLineCurrency);
      }
    } catch (err) {
      console.error("Failed to fetch Skip the Line analytics:", err);
      setError(getApiErrorMessage(err, "Failed to load analytics"));
    }
  };

  const fetchTransactions = async (page: number = 1) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', '20');
      queryParams.append('paymentType', 'SKIP_LINE');
      
      const response = await api.get(`/monetization/payments?waitlistId=${waitlistId}&${queryParams}`);
      setTransactions(response.data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setError(getApiErrorMessage(err, "Failed to load transactions"));
    }
  };

  React.useEffect(() => {
    if (!waitlistId) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        await Promise.all([
          fetchAnalytics(),
          fetchTransactions(1),
        ]);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [waitlistId]);

  const handleToggleSkipLine = async () => {
    if (!analytics) return;
    
    setIsUpdating(true);
    setError(null);

    try {
      await api.patch(`/monetization/skip-line/config/${waitlistId}`, {
        skipLineEnabled: !analytics.skipLineEnabled,
      });
      
      // Refresh data
      await fetchAnalytics();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update Skip the Line settings"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    setError(null);

    try {
      const price = parseFloat(configPrice);
      if (isNaN(price) || price <= 0) {
        setError("Price must be a positive number");
        setIsSavingConfig(false);
        return;
      }

      await api.patch(`/monetization/skip-line/config/${waitlistId}`, {
        skipLineEnabled: true,
        skipLinePrice: price,
        skipLineCurrency: configCurrency,
      });
      
      await fetchAnalytics();
      setShowConfig(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save configuration"));
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchTransactions(page);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "success" | "warning" | "danger" | "outline"; label: string }> = {
      SUCCEEDED: { variant: "success", label: "Succeeded" },
      PENDING: { variant: "warning", label: "Pending" },
      FAILED: { variant: "danger", label: "Failed" },
      EXPIRED: { variant: "outline", label: "Expired" },
      REFUNDED: { variant: "outline", label: "Refunded" },
    };
    
    const { variant, label } = statusMap[status] || { variant: "outline", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getProviderIcon = (provider: string) => {
    return provider === 'STRIPE' ? '💳' : '🔵';
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
            onClick={() => router.push(routes.waitlistMonetization(waitlistId))}
            className="mt-4"
          >
            Back to Monetization
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(routes.waitlistMonetization(waitlistId))}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Monetization
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
            <div className="flex gap-2">
              <Button
                onClick={() => setShowConfig(!showConfig)}
                variant="outline"
              >
                {showConfig ? "Hide Config" : "Configure"}
              </Button>
              <Button
                onClick={handleToggleSkipLine}
                disabled={isUpdating}
                variant={analytics?.skipLineEnabled ? "destructive" : "primary"}
              >
                {isUpdating ? "Updating..." : analytics?.skipLineEnabled ? "Disable Skip the Line" : "Enable Skip the Line"}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}

        {showConfig && analytics && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Skip the Line Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={configPrice}
                    onChange={(e) => setConfigPrice(e.target.value)}
                    placeholder="10.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Currency</label>
                  <select
                    value={configCurrency}
                    onChange={(e) => setConfigCurrency(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="ETB">ETB (ብ)</option>
                    <option value="NGN">NGN (₦)</option>
                    <option value="KES">KES (KSh)</option>
                    <option value="ZAR">ZAR (R)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowConfig(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveConfig}
                  disabled={isSavingConfig}
                >
                  {isSavingConfig ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </CardContent>
          </Card>
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
                          ? `Participants can pay ${analytics.currency === "USD" ? "$" : ""}${Number(analytics.skipLinePrice || 0).toFixed(2)} to move into the priority pool`
                          : "Enable Skip the Line to allow participants to pay for priority placement"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {analytics.currency === "USD" ? "$" : ""}{Number(analytics.skipLinePrice || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Price per participant</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
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
                    {analytics.currency === "USD" ? "$" : ""}{Number(analytics.totalRevenue).toFixed(2)}
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
                    {analytics.currency === "USD" ? "$" : ""}{Number(analytics.platformFees).toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-secondary" />
                    <p className="text-sm font-medium text-muted-foreground">Provider Fees</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {analytics.currency === "USD" ? "$" : ""}{Number(analytics.providerFees).toFixed(2)}
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
                    {analytics.currency === "USD" ? "$" : ""}{Number(analytics.founderRevenue).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Provider Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Payment Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {analytics.byProvider.stripe && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">💳</span>
                        <h4 className="font-semibold text-foreground">Stripe</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Revenue</span>
                          <span className="font-medium">${Number(analytics.byProvider.stripe.totalRevenue).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Paid Skips</span>
                          <span className="font-medium">{analytics.byProvider.stripe.paidParticipants}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Platform Fees</span>
                          <span className="font-medium">${Number(analytics.byProvider.stripe.platformFees).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Provider Fees</span>
                          <span className="font-medium">${Number(analytics.byProvider.stripe.providerFees).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Founder Revenue</span>
                          <span className="font-medium">${Number(analytics.byProvider.stripe.founderRevenue).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {analytics.byProvider.chapa && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🔵</span>
                        <h4 className="font-semibold text-foreground">Chapa</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Revenue</span>
                          <span className="font-medium">{analytics.currency === "USD" ? "$" : ""}{Number(analytics.byProvider.chapa.totalRevenue).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Paid Skips</span>
                          <span className="font-medium">{analytics.byProvider.chapa.paidParticipants}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Platform Fees</span>
                          <span className="font-medium">{analytics.currency === "USD" ? "$" : ""}{Number(analytics.byProvider.chapa.platformFees).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Provider Fees</span>
                          <span className="font-medium">{analytics.currency === "USD" ? "$" : ""}{Number(analytics.byProvider.chapa.providerFees).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Founder Revenue</span>
                          <span className="font-medium">{analytics.currency === "USD" ? "$" : ""}{Number(analytics.byProvider.chapa.founderRevenue).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!analytics.byProvider.stripe && !analytics.byProvider.chapa && (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      No revenue data available yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions && transactions.payments.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <thead className="bg-surface-muted">
                          <TableRow>
                            <TableHeadCell>Participant</TableHeadCell>
                            <TableHeadCell>Amount</TableHeadCell>
                            <TableHeadCell>Provider</TableHeadCell>
                            <TableHeadCell>Status</TableHeadCell>
                            <TableHeadCell>Date</TableHeadCell>
                          </TableRow>
                        </thead>
                        <TableBody>
                          {transactions.payments.map((transaction) => (
                            <TableRow 
                              key={transaction.id}
                              clickable
                              onClick={() => router.push(`/dashboard/waitlists/${waitlistId}/monetization/skip-line/transaction/${transaction.id}`)}
                            >
                              <TableCell>
                                <div>
                                  <div className="font-medium">{transaction.participant.email}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Position: #{transaction.participant.position}
                                    {transaction.participant.hasSkipLinePriority && (
                                      <Badge variant="success" className="ml-2">Priority</Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {transaction.currency === "USD" ? "$" : ""}{Number(transaction.amount).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span>{getProviderIcon(transaction.provider)}</span>
                                  <span className="text-sm">{transaction.provider}</span>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              <TableCell>
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Pagination */}
                    {transactions.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {((transactions.pagination.page - 1) * transactions.pagination.limit + 1)} to {Math.min(transactions.pagination.page * transactions.pagination.limit, transactions.pagination.total)} of {transactions.pagination.total} transactions
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(transactions.pagination.page - 1)}
                            disabled={transactions.pagination.page === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(transactions.pagination.page + 1)}
                            disabled={transactions.pagination.page === transactions.pagination.totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Skip the Line purchases yet</h3>
                    <p className="text-muted-foreground">
                      Revenue and transactions will appear here after participants complete payment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                      <li>• Platform fee is calculated from each transaction</li>
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