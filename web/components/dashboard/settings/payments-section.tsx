"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import { monetizationService, PaymentAccount } from "@/services/monetization";
import { getApiErrorMessage } from "@/lib/errors";
import {
  CreditCard,
  Wallet,
  AlertCircle,
  Loader2,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Unplug,
} from "lucide-react";

export function PaymentsSettingsSection() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState<"STRIPE" | "CHAPA" | null>(null);

  // Chapa state
  const [isChapaDialogOpen, setIsChapaDialogOpen] = useState(false);
  const [isChapaLoading, setIsChapaLoading] = useState(false);
  const [chapaForm, setChapaForm] = useState({ bankCode: "", accountNumber: "", businessName: "" });

  // Handle URL params for Stripe return
  const searchParams = useSearchParams();
  const stripeStatusParam = searchParams.get("stripe");

  const fetchAccounts = async () => {
    try {
      const data = await monetizationService.getAccounts();
      setAccounts(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load payment accounts"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();

    // Show toast based on Stripe return status
    if (stripeStatusParam) {
      if (stripeStatusParam === "active") {
        toast.success("Stripe account connected successfully!");
      } else if (stripeStatusParam === "action_required") {
        toast("Stripe account needs more information.", { icon: "⚠️" });
      } else if (stripeStatusParam === "pending") {
        toast("Stripe onboarding is incomplete.", { icon: "⏳" });
      } else if (stripeStatusParam === "error") {
        toast.error("Failed to connect Stripe account.");
      }

      // Clean up URL parameter without page reload
      const url = new URL(window.location.href);
      url.searchParams.delete("stripe");
      window.history.replaceState({}, "", url);
    }
  }, [stripeStatusParam]);

  const stripeAccount = accounts.find((a) => a.provider === "STRIPE");
  const chapaAccount = accounts.find((a) => a.provider === "CHAPA");

  const handleConnectStripe = async (isRefresh = false) => {
    try {
      setIsStripeLoading(true);
      if (isRefresh) {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        window.location.href = `${backendUrl}/api/monetization/accounts/stripe/refresh`;
      } else {
        const { url } = await monetizationService.connectStripe();
        if (!url) {
          toast.error("Could not generate a Stripe onboarding link. Please try again.");
          setIsStripeLoading(false);
          return;
        }
        window.location.href = url;
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to initiate Stripe connection"));
      setIsStripeLoading(false);
    }
  };

  const handleConnectChapa = async () => {
    try {
      setIsChapaLoading(true);
      await monetizationService.connectChapa(
        chapaForm.bankCode,
        chapaForm.accountNumber,
        chapaForm.businessName,
      );
      toast.success("Chapa account connected successfully!");
      setIsChapaDialogOpen(false);
      setChapaForm({ bankCode: "", accountNumber: "", businessName: "" });
      fetchAccounts();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to connect Chapa"));
    } finally {
      setIsChapaLoading(false);
    }
  };

  const handleDisconnect = (provider: "STRIPE" | "CHAPA") => {
    const providerLabel = provider === "STRIPE" ? "Stripe" : "Chapa";

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Disconnect {providerLabel}?</p>
          <p className="text-xs text-muted-foreground">
            You won't be able to receive payments until you reconnect.
          </p>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
              onClick={async () => {
                toast.dismiss(t.id);
                setDisconnecting(provider);
                try {
                  await monetizationService.disconnectAccount(provider);
                  toast.success(`${providerLabel} disconnected`);
                  fetchAccounts();
                } catch (error) {
                  toast.error(getApiErrorMessage(error, `Failed to disconnect ${providerLabel}`));
                } finally {
                  setDisconnecting(null);
                }
              }}
            >
              Disconnect
            </button>
            <button
              className="flex-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 10000 },
    );
  };

  const renderStatusBadge = (account: PaymentAccount) => {
    switch (account.status) {
      case "ACTIVE":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Connected
          </Badge>
        );
      case "ACTION_REQUIRED":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Action Required
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Incomplete
          </Badge>
        );
      case "ERROR":
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      case "DISCONNECTED":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
            <Unplug className="h-3 w-3" />
            Disconnected
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderStripeContent = () => {
    if (!stripeAccount) {
      return (
        <Button onClick={() => handleConnectStripe(false)} disabled={isStripeLoading} className="w-full sm:w-auto">
          {isStripeLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-4 w-4" />
          )}
          Connect Stripe
        </Button>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {renderStatusBadge(stripeAccount)}
          {stripeAccount.connectedAt && stripeAccount.status === "ACTIVE" && (
            <span className="text-xs text-muted-foreground">
              Since {new Date(stripeAccount.connectedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {stripeAccount.status === "ERROR" && stripeAccount.lastError && (
          <p className="text-xs text-destructive">{stripeAccount.lastError}</p>
        )}

        {stripeAccount.status === "ACTION_REQUIRED" && (
          <p className="text-xs text-muted-foreground">Additional information is required by Stripe.</p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {["PENDING", "ACTION_REQUIRED", "ERROR", "DISCONNECTED"].includes(stripeAccount.status) && (
            <Button size="sm" variant="outline" onClick={() => handleConnectStripe(true)} disabled={isStripeLoading}>
              {isStripeLoading ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-3 w-3" />
              )}
              {stripeAccount.status === "DISCONNECTED" ? "Reconnect" : "Continue Setup"}
            </Button>
          )}
          {["ACTIVE", "PENDING", "ACTION_REQUIRED", "ERROR"].includes(stripeAccount.status) && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleDisconnect("STRIPE")}
              disabled={disconnecting === "STRIPE"}
            >
              {disconnecting === "STRIPE" ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <Unplug className="mr-2 h-3 w-3" />
              )}
              Disconnect
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderChapaContent = () => {
    if (!chapaAccount) {
      return (
        <Button onClick={() => setIsChapaDialogOpen(true)} className="w-full sm:w-auto">
          <Wallet className="mr-2 h-4 w-4" />
          Connect Chapa
        </Button>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {renderStatusBadge(chapaAccount)}
          {chapaAccount.connectedAt && chapaAccount.status === "ACTIVE" && (
            <span className="text-xs text-muted-foreground">
              Since {new Date(chapaAccount.connectedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {chapaAccount.status === "ERROR" && chapaAccount.lastError && (
          <p className="text-xs text-destructive">{chapaAccount.lastError}</p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {["DISCONNECTED", "ERROR"].includes(chapaAccount.status) && (
            <Button size="sm" variant="outline" onClick={() => setIsChapaDialogOpen(true)}>
              <RefreshCcw className="mr-2 h-3 w-3" />
              Reconnect
            </Button>
          )}
          {["ACTIVE", "PENDING", "ACTION_REQUIRED", "ERROR"].includes(chapaAccount.status) && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleDisconnect("CHAPA")}
              disabled={disconnecting === "CHAPA"}
            >
              {disconnecting === "CHAPA" ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <Unplug className="mr-2 h-3 w-3" />
              )}
              Disconnect
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton variant="rectangular" className="h-52" />
        <Skeleton variant="rectangular" className="h-52" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Stripe Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Stripe
            </CardTitle>
            <CardDescription>
              Accept international card payments. Funds are transferred directly to your bank account.
            </CardDescription>
          </CardHeader>
          <CardContent>{renderStripeContent()}</CardContent>
        </Card>

        {/* Chapa Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Chapa
            </CardTitle>
            <CardDescription>
              Accept payments in Ethiopia via Telebirr, CBE Birr, and local bank cards.
            </CardDescription>
          </CardHeader>
          <CardContent>{renderChapaContent()}</CardContent>
        </Card>
      </div>

      {/* Chapa Connection Dialog */}
      <Dialog open={isChapaDialogOpen} onClose={() => setIsChapaDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Chapa</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your bank details to create a Chapa subaccount. This lets you receive payouts directly.{" "}
              <a
                href="https://dashboard.chapa.co"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Find your bank code on the Chapa Dashboard ↗
              </a>
            </p>
            <Input
              label="Business Name"
              value={chapaForm.businessName}
              onChange={(e) => setChapaForm({ ...chapaForm, businessName: e.target.value })}
              placeholder="e.g. WaitlistOS Payments"
            />
            <Input
              label="Bank Code"
              value={chapaForm.bankCode}
              onChange={(e) => setChapaForm({ ...chapaForm, bankCode: e.target.value })}
              placeholder="e.g. 946 (CBE)"
            />
            <Input
              label="Account Number"
              value={chapaForm.accountNumber}
              onChange={(e) => setChapaForm({ ...chapaForm, accountNumber: e.target.value })}
              placeholder="Your bank account number"
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsChapaDialogOpen(false)} disabled={isChapaLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleConnectChapa}
              disabled={!chapaForm.bankCode || !chapaForm.accountNumber || !chapaForm.businessName || isChapaLoading}
            >
              {isChapaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
