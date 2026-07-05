"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { AuthForm } from "@/components/features/auth/forms/auth-form";
import { OTPInput } from "@/components/ui/otp-input";
import { Button } from "@/components/ui/button";
import { twoFactorSchema, type TwoFactorFormData } from "@/lib/validations/auth";
import { setupTwoFactor, enableTwoFactor } from "@/services/auth";
import { useToast } from "@/components/ui/toast";
import { Alert } from "@/components/ui/alert";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuth } from "@/contexts/auth-context";
import { routes } from "@/lib/routes";

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshUser, patchUser } = useAuth();
  const [qrCode, setQrCode] = React.useState<string>("");
  const [secret, setSecret] = React.useState<string>("");
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [step, setStep] = React.useState<"setup" | "verify">("setup");

  const handleSetup = React.useCallback(async () => {
    try {
      const data = await setupTwoFactor();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
    } catch (error: unknown) {
      toast({
        title: getApiErrorMessage(error, "Failed to setup 2FA"),
        variant: "error",
      });
    }
  }, [toast]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void handleSetup();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [handleSetup]);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnable = async (data: TwoFactorFormData) => {
    try {
      await enableTwoFactor(data);
      patchUser({ isTwoFactorEnabled: true });
      await refreshUser();
      toast({
        title: "Two-factor authentication enabled successfully",
        variant: "success",
      });
      router.replace(routes.settingsTab("security"));
    } catch (error: unknown) {
      toast({
        title: getApiErrorMessage(error, "Failed to enable 2FA"),
        variant: "error",
      });
    }
  };

  return (
    <AuthLayout
      title="Setup two-factor authentication"
      description="Add an extra layer of security to your account"
      backLinkHref={routes.settingsTab("security")}
      backLinkText="Back to security"
    >
      {step === "setup" && (
        <div className="space-y-6">
          <Alert variant="info" title="Important">
            Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)
          </Alert>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl">
              {qrCode ? (
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              )}
            </div>
          </div>

          {/* Secret Key */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Secret Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border border-border bg-surface-muted px-4 py-3 font-mono text-sm text-foreground">
                {secret}
              </code>
              <button
                type="button"
                onClick={handleCopySecret}
                className="rounded-md border border-border bg-surface p-3 transition-colors hover:bg-surface-muted"
                title="Copy secret"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Backup Codes */}
          <div>
            <button
              type="button"
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              className="text-sm text-primary transition-colors hover:text-primary-hover"
            >
              {showBackupCodes ? "Hide" : "Show"} backup codes
            </button>
            {showBackupCodes && (
              <Alert variant="warning" title="Backup codes" className="mt-2">
                <p className="mb-3 text-sm">
                  Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code
                      key={index}
                      className="rounded-md border border-border bg-surface-muted px-3 py-2 font-mono text-sm text-foreground"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              </Alert>
            )}
          </div>

          <Button
            onClick={() => setStep("verify")}
            className="w-full"
            disabled={!qrCode}
          >
            Continue
          </Button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-6">
          <Alert variant="info" title="Verify setup">
            Enter the 6-digit code from your authenticator app to complete the setup.
          </Alert>

          <AuthForm
            schema={twoFactorSchema}
            onSubmit={handleEnable}
            submitText="Enable two-factor authentication"
          >
            {({ watch, setValue, formState: { errors } }) => (
              <div className="flex justify-center">
                <OTPInput
                  length={6}
                  value={watch("code") || ""}
                  onChange={(value) => setValue("code", value, { shouldValidate: true })}
                  error={errors.code?.message}
                  autoFocus
                />
              </div>
            )}
          </AuthForm>

          <Button
            variant="ghost"
            onClick={() => setStep("setup")}
            className="w-full"
          >
            Back
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
