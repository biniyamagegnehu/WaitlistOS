"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Monitor } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/components/features/auth/forms/auth-form";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/contexts/auth-context";
import { changePassword, changeEmail } from "@/services/auth";
import { changePasswordSchema, changeEmailSchema } from "@/lib/validations/auth";
import type { ChangePasswordFormData, ChangeEmailFormData } from "@/lib/validations/auth";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";

export default function SecurityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading, refreshUser } = useCurrentUser();
  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const [showChangeEmail, setShowChangeEmail] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace(routes.login);
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-32" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton variant="rectangular" className="h-48" />
          <Skeleton variant="rectangular" className="h-48" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    const passwordData = {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    };
    await changePassword(passwordData);
    setShowChangePassword(false);
  };

  const handleChangeEmail = async (data: ChangeEmailFormData) => {
    await changeEmail(data);
    setShowChangeEmail(false);
    await refreshUser();
    toast({
      title: "Verification email sent to your new email address",
      variant: "success",
    });
  };

  const handleDisable2FA = async () => {
    router.push(routes.twoFactorDisable);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Security Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your account security</p>
      </div>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          {!showChangePassword ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Password</p>
                <p className="text-sm text-zinc-400">Last changed recently</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowChangePassword(true)}
              >
                Change
              </Button>
            </div>
          ) : (
            <AuthForm
              schema={changePasswordSchema}
              onSubmit={handleChangePassword}
              submitText="Update password"
              onSuccessMessage="Password updated successfully"
            >
              {({ register, formState: { errors } }) => (
                <div className="space-y-4">
                  <PasswordInput
                    label="Current password"
                    placeholder="••••••••"
                    error={errors.currentPassword?.message as string | undefined}
                    {...register("currentPassword")}
                  />
                  <PasswordInput
                    label="New password"
                    placeholder="••••••••"
                    showStrength
                    error={errors.newPassword?.message as string | undefined}
                    {...register("newPassword")}
                  />
                  <PasswordInput
                    label="Confirm new password"
                    placeholder="••••••••"
                    error={errors.confirmPassword?.message as string | undefined}
                    {...register("confirmPassword")}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => setShowChangePassword(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </AuthForm>
          )}
        </CardContent>
      </Card>

      {/* Change Email */}
      <Card>
        <CardHeader>
          <CardTitle>Change Email</CardTitle>
        </CardHeader>
        <CardContent>
          {!showChangeEmail ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">{user.email}</p>
                <p className="text-sm text-zinc-400">
                  {user.isEmailVerified ? "Verified" : "Not verified"}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowChangeEmail(true)}
              >
                Change
              </Button>
            </div>
          ) : (
            <AuthForm
              schema={changeEmailSchema}
              onSubmit={handleChangeEmail}
              submitText="Send verification email"
              onSuccessMessage="Verification email sent"
            >
              {({ register, formState: { errors } }) => (
                <div className="space-y-4">
                  <Input
                    label="New email"
                    type="email"
                    placeholder="you@example.com"
                    leftIcon={<Mail className="h-4 w-4" />}
                    error={errors.newEmail?.message as string | undefined}
                    {...register("newEmail")}
                  />
                  <PasswordInput
                    label="Current password"
                    placeholder="••••••••"
                    error={errors.password?.message as string | undefined}
                    {...register("password")}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => setShowChangeEmail(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </AuthForm>
          )}
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">2FA Status</p>
              <p className="text-sm text-zinc-400">
                {user.isTwoFactorEnabled
                  ? "Your account is protected with 2FA"
                  : "Add an extra layer of security"}
              </p>
            </div>
            <Badge variant={user.isTwoFactorEnabled ? "success" : "warning"}>
              {user.isTwoFactorEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div className="mt-4">
            {user.isTwoFactorEnabled ? (
              <Button
                variant="danger"
                onClick={handleDisable2FA}
                className="w-full"
              >
                Disable 2FA
              </Button>
            ) : (
              <Button
                onClick={() => router.push(routes.twoFactorSetup)}
                className="w-full"
              >
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Manage your active sessions</p>
              <p className="text-sm text-zinc-400">
                View and revoke sessions on other devices
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push(routes.sessions)}
              leftIcon={<Monitor className="h-4 w-4" />}
            >
              View Sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/25">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" title="Account Actions">
            <p className="text-sm mb-4">
              These actions are irreversible. Please be certain.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" className="flex-1">
                Delete Account
              </Button>
            </div>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
