"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { DollarSign, CreditCard, CheckCircle, XCircle, Clock, Calendar, User, Hash, BadgeCheck, TrendingUp } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/axios";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { BackButton } from "@/components/navigation/back-button";
import { LoadingState } from "@/components/patterns/loading-state";
import { useSetBreadcrumbs } from "@/components/navigation/breadcrumbs";

interface PaymentDetails {
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
  chargedAmount?: number | string;
  chargedCurrency?: string;
  createdAt: string;
  updatedAt: string;
  participant: {
    id: string;
    email: string;
    position: number;
    hasSkipLinePriority: boolean;
    createdAt: string;
  };
  waitlist: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const setBreadcrumbs = useSetBreadcrumbs();
  const waitlistId = params?.id as string;
  const transactionId = params?.transactionId as string;
  const [error, setError] = React.useState<string | null>(null);
  const [payment, setPayment] = React.useState<PaymentDetails | null>(null);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  // Update breadcrumbs when payment loads
  React.useEffect(() => {
    if (payment && payment.participant.email && setBreadcrumbs) {
      setBreadcrumbs([
        { label: "Waitlists", href: "/dashboard/waitlists" },
        { label: "Monetization", href: `/dashboard/waitlists/${waitlistId}/monetization` },
        { label: "Skip the Line", href: `/dashboard/waitlists/${waitlistId}/monetization/skip-line` },
        { label: "Transaction", href: undefined },
        { label: payment.participant.email.split('@')[0], href: undefined },
      ]);
    }
  }, [payment, waitlistId, setBreadcrumbs]);

  // Reset breadcrumbs when unmounting
  React.useEffect(() => {
    return () => {
      if (setBreadcrumbs) {
        setBreadcrumbs(null);
      }
    };
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  React.useEffect(() => {
    if (!waitlistId || !transactionId) return;

    const fetchPaymentDetails = async () => {
      try {
        const response = await api.get(`/monetization/payments/${transactionId}`);
        setPayment(response.data);
      } catch (err) {
        console.error("Failed to fetch payment details:", err);
        setError(getApiErrorMessage(err, "Failed to load payment details"));
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchPaymentDetails();
  }, [waitlistId, transactionId]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "success" | "warning" | "danger" | "outline"; label: string; icon: any }> = {
      SUCCEEDED: { variant: "success", label: "Succeeded", icon: CheckCircle },
      PENDING: { variant: "warning", label: "Pending", icon: Clock },
      FAILED: { variant: "danger", label: "Failed", icon: XCircle },
      EXPIRED: { variant: "outline", label: "Expired", icon: Clock },
    };
    
    const { variant, label, icon: Icon } = statusMap[status] || { variant: "outline", label: status, icon: Clock };
    return <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>;
  };

  const getProviderIcon = (provider: string) => {
    return provider === 'STRIPE' ? '💳' : '🔵';
  };

  if (isLoading || !isAuthenticated) {
    return <LoadingScreen />;
  }

  if (isLoadingData) {
    return (
      <PageContainer>
        <LoadingState message="Loading payment details..." />
      </PageContainer>
    );
  }

  if (error && !payment) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-4xl">
          <Alert variant="error" title="Error">
            {error}
          </Alert>
          <BackButton 
            href={`/dashboard/waitlists/${waitlistId}/monetization/skip-line`}
            label="Back to Skip the Line"
            className="mt-4"
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-4xl space-y-6">
        <BackButton href={`/dashboard/waitlists/${waitlistId}/monetization/skip-line`} label="Back to Skip the Line" className="mb-4" />
        <PageHeader
          title="Transaction Details"
          description="Payment information and participant details"
        />

        {error && (
          <Alert variant="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}

        {payment && (
          <div className="space-y-6">
            {/* Payment Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Payment Status</CardTitle>
                  {getStatusBadge(payment.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-success/20">
                    {payment.status === 'SUCCEEDED' && <CheckCircle className="h-8 w-8 text-success" />}
                    {payment.status === 'PENDING' && <Clock className="h-8 w-8 text-warning" />}
                    {payment.status === 'FAILED' && <XCircle className="h-8 w-8 text-danger" />}
                    {payment.status !== 'SUCCEEDED' && payment.status !== 'PENDING' && payment.status !== 'FAILED' && <Clock className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {payment.status === 'SUCCEEDED' ? 'Payment Successful' :
                       payment.status === 'PENDING' ? 'Payment Processing' :
                       payment.status === 'FAILED' ? 'Payment Failed' :
                       'Payment ' + payment.status}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {payment.status === 'SUCCEEDED' ? 'The payment has been successfully processed and priority has been granted.' :
                       payment.status === 'PENDING' ? 'The payment is currently being processed by the payment provider.' :
                       payment.status === 'FAILED' ? 'The payment failed or was cancelled.' :
                       `Payment status: ${payment.status}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <div>
                        <span className="font-medium text-foreground">Gross Amount</span>
                        {payment.chargedAmount && payment.chargedCurrency && (
                          <span className="text-xs text-muted-foreground block">
                            (Base: ${Number(payment.amount).toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-foreground">
                        ${Number(payment.chargedAmount || payment.amount).toFixed(2)}
                      </span>
                      {payment.chargedAmount && payment.chargedCurrency && payment.chargedCurrency !== payment.currency && (
                        <span className="text-xs text-muted-foreground block">
                          Provider converted to {payment.chargedCurrency}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-secondary" />
                      <span className="font-medium text-foreground">Provider Fee</span>
                    </div>
                    <span className="text-xl font-bold text-foreground">
                      -${Number(payment.providerFee).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-warning" />
                      <span className="font-medium text-foreground">Platform Fee</span>
                    </div>
                    <span className="text-xl font-bold text-foreground">
                      -${Number(payment.platformFee).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-success/10 border border-success/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-success" />
                      <span className="font-semibold text-foreground">Founder Net Revenue</span>
                    </div>
                    <span className="text-2xl font-bold text-success">
                      ${Number(payment.founderAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <code className="text-sm bg-muted px-2 py-1 rounded">{payment.id.slice(0, 8)}...</code>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Provider Transaction ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl">{getProviderIcon(payment.provider)}</span>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{payment.providerPaymentId.slice(0, 20)}...</code>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Provider</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl">{getProviderIcon(payment.provider)}</span>
                      <span className="font-medium text-foreground">{payment.provider}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Type</label>
                    <div className="mt-1">
                      <Badge variant="outline">{payment.paymentType.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{new Date(payment.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{new Date(payment.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participant Information */}
            <Card>
              <CardHeader>
                <CardTitle>Participant Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Participant Email</label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{payment.participant.email}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Position</label>
                    <div className="flex items-center gap-2 mt-1">
                      <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold text-foreground">#{payment.participant.position}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority Status</label>
                    <div className="mt-1">
                      {payment.participant.hasSkipLinePriority ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <BadgeCheck className="h-3 w-3" />
                          Priority Access Granted
                        </Badge>
                      ) : (
                        <Badge variant="outline">Normal Position</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Joined Waitlist</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{new Date(payment.participant.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Waitlist</label>
                    <div className="mt-1">
                      <span className="font-medium text-foreground">{payment.waitlist.name}</span>
                </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <BackButton
              href={`/dashboard/waitlists/${waitlistId}/monetization/skip-line`}
              label="Back to Skip the Line Dashboard"
              variant="primary"
              className="w-full justify-center"
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}