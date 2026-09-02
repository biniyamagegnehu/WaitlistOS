"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ShoppingCart, DollarSign, Users } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingState } from "@/components/patterns/loading-state";
import { ErrorState } from "@/components/patterns/error-state";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { BackButton } from "@/components/navigation/back-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHeadCell, TableRow } from "@/components/ui/table";
import { api } from "@/lib/axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const configSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Amount must be a positive number"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface PreOrderAnalytics {
  totalDeposits: number;
  grossRevenue: number | string;
}

interface PreOrderConfig {
  preOrderDepositEnabled: boolean;
  preOrderDepositAmount: number | string | null;
  preOrderDepositDescription: string | null;
}

interface Deposit {
  id: string;
  amount: number | string;
  currency: string;
  provider: string;
  status: string;
  createdAt: string;
  participant: {
    name: string | null;
    email: string;
  };
}

export default function PreOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const waitlistId = params?.id as string;
  
  const [error, setError] = React.useState<string | null>(null);
  const [analytics, setAnalytics] = React.useState<PreOrderAnalytics | null>(null);
  const [config, setConfig] = React.useState<PreOrderConfig | null>(null);
  const [deposits, setDeposits] = React.useState<Deposit[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [showConfig, setShowConfig] = React.useState(false);
  const [isSavingConfig, setIsSavingConfig] = React.useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      amount: "",
      description: "",
    },
  });

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchData = async () => {
    try {
      const [configRes, analyticsRes, depositsRes] = await Promise.all([
        api.get(`/monetization/pre-order/config/${waitlistId}`),
        api.get(`/monetization/pre-order/analytics/${waitlistId}`),
        api.get(`/monetization/pre-order/deposits/${waitlistId}`)
      ]);
      
      setConfig(configRes.data);
      setAnalytics(analyticsRes.data);
      setDeposits(depositsRes.data);

      if (configRes.data.preOrderDepositAmount) {
        reset({
          amount: Number(configRes.data.preOrderDepositAmount).toString(),
          description: configRes.data.preOrderDepositDescription || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch Pre-Order data:", err);
      setError(getApiErrorMessage(err, "Failed to load data"));
    }
  };

  React.useEffect(() => {
    if (!waitlistId) return;

    const loadData = async () => {
      setIsLoadingData(true);
      await fetchData();
      setIsLoadingData(false);
    };

    loadData();
  }, [waitlistId]);

  const handleToggleFeature = async () => {
    if (!config) return;
    
    setIsUpdating(true);
    setError(null);

    try {
      await api.patch(`/monetization/pre-order/config/${waitlistId}`, {
        preOrderDepositEnabled: !config.preOrderDepositEnabled,
      });
      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update Pre-Order Deposit settings"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveConfig = async (data: ConfigFormData) => {
    setIsSavingConfig(true);
    setError(null);

    try {
      const amount = parseFloat(data.amount);
      
      await api.patch(`/monetization/pre-order/config/${waitlistId}`, {
        preOrderDepositEnabled: true,
        preOrderDepositAmount: amount,
        preOrderDepositDescription: data.description?.trim() || null,
      });
      
      await fetchData();
      setShowConfig(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save configuration"));
    } finally {
      setIsSavingConfig(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "success" | "warning" | "danger" | "outline"; label: string }> = {
      PAID: { variant: "success", label: "Paid" },
      PENDING: { variant: "warning", label: "Pending" },
      FAILED: { variant: "danger", label: "Failed" },
      CANCELLED: { variant: "outline", label: "Cancelled" },
      COLLECTION_PENDING: { variant: "warning", label: "Collection Pending" },
      COLLECTED: { variant: "success", label: "Collected" },
    };
    
    const { variant, label } = statusMap[status] || { variant: "outline", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

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

  return (
    <PageContainer>
      <BackButton href={routes.waitlistMonetization(waitlistId)} label="Back to Monetization" className="mb-4" />
      <PageHeader
        title="Pre-Order Deposits"
        description="Manage deposits and waitlist reservations"
        breadcrumbs={[
          { label: "Waitlists", href: routes.waitlists },
          { label: "Waitlist", href: routes.waitlist(waitlistId) },
          { label: "Monetization", href: routes.waitlistMonetization(waitlistId) },
          { label: "Pre-Order Deposits" },
        ]}
        primaryAction={
          <div className="flex gap-2 items-center">
            <Button onClick={() => setShowConfig(!showConfig)} variant="outline">
              {showConfig ? "Hide Config" : "Configure"}
            </Button>
            <div className="flex items-center gap-2">
              <Switch
                checked={config?.preOrderDepositEnabled}
                onCheckedChange={handleToggleFeature}
                disabled={isUpdating}
              />
              <span className="text-sm text-text-muted">
                {isUpdating ? "Updating..." : config?.preOrderDepositEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        }
      />

      {error && <Alert variant="error" title="Error" className="mb-6">{error}</Alert>}

        {showConfig && config && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Deposit Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleSaveConfig)} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-text-primary">Deposit Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="50.00"
                    className="mt-1"
                    {...register("amount")}
                  />
                  {errors.amount && <p className="text-xs text-error mt-1">{errors.amount.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-text-primary">Product Description (Optional)</label>
                  <Input
                    placeholder="A short description of the product (max 500 characters)"
                    className="mt-1"
                    {...register("description")}
                  />
                  {errors.description && <p className="text-xs text-error mt-1">{errors.description.message}</p>}
                </div>
                <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                  <Button variant="outline" type="button" onClick={() => setShowConfig(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSavingConfig}>
                    {isSavingConfig ? "Saving..." : "Save Configuration"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {config && analytics && (
          <div className="space-y-6">
            <Card className={config?.preOrderDepositEnabled ? "border-success/20 bg-success/5" : "border-border"}>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-text-primary">{config?.preOrderDepositEnabled ? "Deposits are Enabled" : "Deposits are Disabled"}</h3>
                  <p className="text-sm text-text-muted">Charge participants an upfront deposit to secure their spot.</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-text-primary">
                    {Number(config?.preOrderDepositAmount || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-text-muted">Base price</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-primary" /><p className="text-sm font-medium text-text-muted">Total Deposits</p></div>
                  <p className="text-3xl font-bold text-text-primary">{analytics.totalDeposits}</p>
                  <p className="text-xs text-text-muted mt-1">Paid deposits</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-success" /><p className="text-sm font-medium text-text-muted">Gross Revenue</p></div>
                  <p className="text-3xl font-bold text-text-primary">
                    {Number(analytics.grossRevenue).toFixed(2)}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Total collected</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Deposits</CardTitle></CardHeader>
              <CardContent>
                {deposits.length > 0 ? (
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
                      {deposits.map((deposit) => (
                        <TableRow key={deposit.id}>
                          <TableCell>{deposit.participant.email}</TableCell>
                          <TableCell>
                            <div>
                              ${Number(deposit.amount).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {deposit.provider === 'STRIPE' ? 'Stripe' : deposit.provider === 'CHAPA' ? 'Chapa' : deposit.provider}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                          <TableCell>{new Date(deposit.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-text-muted text-center py-4">No deposits yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
    </PageContainer>
  );
}
