"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeft, ShoppingCart, TrendingUp, DollarSign, Users, CreditCard, Zap } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHeadCell, TableRow } from "@/components/ui/table";
import { api } from "@/lib/axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const configSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Amount must be a positive number"),
  currency: z.enum(["USD", "EUR", "GBP"]),
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
  preOrderDepositCurrency: string | null;
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
      currency: "USD",
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
          currency: configRes.data.preOrderDepositCurrency || "USD",
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
        preOrderDepositCurrency: data.currency,
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

  if (isLoading || !isAuthenticated) return <LoadingScreen />;

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-3xl font-semibold text-foreground">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push(routes.monetization)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Monetization
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="h-8 w-8 text-primary" />
                Pre-Order Deposits
              </h1>
              <p className="mt-2 text-muted-foreground">Manage deposits and waitlist reservations</p>
            </div>
            <div className="flex gap-2 items-center">
              <Button onClick={() => setShowConfig(!showConfig)} variant="outline">
                {showConfig ? "Hide Config" : "Configure"}
              </Button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleFeature}
                  disabled={isUpdating}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config?.preOrderDepositEnabled ? 'bg-primary' : 'bg-surface-muted'
                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config?.preOrderDepositEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-muted-foreground">
                  {isUpdating ? "Updating..." : config?.preOrderDepositEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && <Alert variant="error" title="Error" className="mb-6">{error}</Alert>}

        {showConfig && config && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Deposit Configuration</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleSaveConfig)} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">Deposit Amount</label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    placeholder="50.00" 
                    className="mt-1" 
                    {...register("amount")}
                  />
                  {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Currency</label>
                  <select 
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register("currency")}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                  {errors.currency && <p className="text-xs text-destructive mt-1">{errors.currency.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Product Description (Optional)</label>
                  <Input 
                    placeholder="A short description of the product (max 500 characters)" 
                    className="mt-1" 
                    {...register("description")}
                  />
                  {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
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
                  <h3 className="font-semibold text-foreground">{config?.preOrderDepositEnabled ? "Deposits are Enabled" : "Deposits are Disabled"}</h3>
                  <p className="text-sm text-muted-foreground">Charge participants an upfront deposit to secure their spot.</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {config?.preOrderDepositCurrency === "USD" ? "$" : ""}{Number(config?.preOrderDepositAmount || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{config?.preOrderDepositCurrency || "USD"}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-primary" /><p className="text-sm font-medium text-muted-foreground">Total Deposits</p></div>
                  <p className="text-3xl font-bold text-foreground">{analytics.totalDeposits}</p>
                  <p className="text-xs text-muted-foreground mt-1">Paid deposits</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-success" /><p className="text-sm font-medium text-muted-foreground">Gross Revenue</p></div>
                  <p className="text-3xl font-bold text-foreground">
                    {config?.preOrderDepositCurrency === "USD" ? "$" : ""}{Number(analytics.grossRevenue).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{config?.preOrderDepositCurrency || "USD"}</p>
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
                          <TableCell>{deposit.currency === "USD" ? "$" : ""}{Number(deposit.amount).toFixed(2)}</TableCell>
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
                  <p className="text-muted-foreground text-center py-4">No deposits yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
