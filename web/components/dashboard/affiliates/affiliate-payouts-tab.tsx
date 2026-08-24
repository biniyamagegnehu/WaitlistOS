"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { affiliateService, AffiliatePayout, PaymentAccountSummary } from "@/services/affiliates";
import { CheckCircle2, XCircle, Loader2, ExternalLink, Settings, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

interface AffiliatePayoutsTabProps {
  paymentAccounts: PaymentAccountSummary[];
  preferredPayoutProvider: string | null;
  payouts: AffiliatePayout[];
  formatCurrency: (amount: number, currency?: string) => string;
  onPreferenceUpdated: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  STRIPE: "Stripe",
  CHAPA: "Chapa",
};

function getStatusVariant(status: string): "default" | "outline" | "success" | "danger" {
  switch (status) {
    case "PAID": return "success";
    case "PROCESSING": return "outline";
    case "FAILED": return "danger";
    default: return "default";
  }
}

export function AffiliatePayoutsTab({
  paymentAccounts,
  preferredPayoutProvider,
  payouts,
  formatCurrency,
  onPreferenceUpdated,
}: AffiliatePayoutsTabProps) {
  const [saving, setSaving] = useState(false);
  const [localPreferred, setLocalPreferred] = useState<string | null>(preferredPayoutProvider);

  const eligibleAccounts = paymentAccounts.filter((a) => a.isEligible);

  const handleSavePreference = async () => {
    if (!localPreferred) return;
    setSaving(true);
    try {
      await affiliateService.setPayoutPreference(localPreferred as "STRIPE" | "CHAPA");
      toast.success("Payout preference saved.");
      onPreferenceUpdated();
    } catch (err: any) {
      console.error('Payout preference save error:', err);
      
      let errorMessage = "Failed to save preference.";
      
      if (err?.response?.status === 401) {
        errorMessage = "Please log in to save your payout preference.";
      } else if (err?.response?.status === 400) {
        errorMessage = "Invalid payout provider selected.";
      } else if (err?.response?.status === 404) {
        errorMessage = "Payment account not found. Please connect it in Payment Settings.";
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Payout Settings
          </CardTitle>
          <CardDescription>
            Payouts are sent monthly to your connected payment provider.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentAccounts.length === 0 ? (
            /* No payment provider connected at all */
            <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
              <XCircle className="mx-auto h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">No payment provider connected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect Stripe or Chapa in your Payment Settings to receive affiliate payouts.
                </p>
              </div>
              <a
                href="/dashboard/settings/payments"
                id="go-to-payment-settings-btn"
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Go to Payment Settings
              </a>
            </div>
          ) : (
            <>
              {/* Connected providers grid */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Connected providers</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {paymentAccounts.map((account) => (
                    <div
                      key={account.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        account.isEligible
                          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                          : "bg-muted/40 border-muted"
                      }`}
                    >
                      {account.isEligible ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{PROVIDER_LABELS[account.provider] ?? account.provider}</p>
                        <p className={`text-xs ${account.isEligible ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                          {account.isEligible ? "Connected & eligible" : `Status: ${account.status}`}
                        </p>
                      </div>
                      {!account.isEligible && (
                        <a
                          href="/dashboard/settings/payments"
                          className="text-xs rounded-md border px-2 py-1 hover:bg-muted transition-colors shrink-0"
                        >
                          Fix
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferred provider selector — only shown if multiple eligible */}
              {eligibleAccounts.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4 text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-300">No eligible payout provider</p>
                  <p className="text-amber-700 dark:text-amber-400 mt-1 text-xs">
                    Your connected provider(s) have a restricted or error status. Please check your{" "}
                    <a href="/dashboard/settings/payments" className="underline font-medium">Payment Settings</a>.
                  </p>
                </div>
              ) : eligibleAccounts.length === 1 ? (
                <div className="text-sm text-muted-foreground">
                  Payouts will be sent to your connected{" "}
                  <span className="font-medium text-foreground">
                    {PROVIDER_LABELS[eligibleAccounts[0].provider]}
                  </span>{" "}
                  account automatically.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Preferred payout provider</p>
                  <div className="space-y-2">
                    {eligibleAccounts.map((account) => (
                      <label
                        key={account.id}
                        id={`payout-provider-${account.provider.toLowerCase()}`}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          localPreferred === account.provider
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="preferred_payout_provider"
                          value={account.provider}
                          checked={localPreferred === account.provider}
                          onChange={() => setLocalPreferred(account.provider)}
                          className="h-4 w-4 text-primary"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{PROVIDER_LABELS[account.provider]}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">Connected</p>
                        </div>
                        {localPreferred === account.provider && (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                  <Button
                    id="save-payout-preference-btn"
                    size="sm"
                    onClick={handleSavePreference}
                    disabled={saving || localPreferred === preferredPayoutProvider}
                  >
                    {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                    Save Preference
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Monthly payouts are processed automatically on the 1st of each month.</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">No payouts yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your first payout will be processed once you have eligible commissions.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {payouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(Number(payout.amount), payout.currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payout.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(payout.status)}>{payout.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
