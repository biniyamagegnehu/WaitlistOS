"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, Calendar, Building2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/contexts/auth-context";
import { routes } from "@/lib/routes";

export function ProfileSettingsSection() {
  const router = useRouter();
  const { user, founder, isLoading } = useCurrentUser();

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

  if (!user) return null;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return "U";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar
              size="xl"
              fallback={getInitials(user.firstName, user.lastName, user.email)}
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.firstName || user.lastName || user.email}
              </h2>
              <p className="mt-1 text-muted-foreground">{user.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={user.isEmailVerified ? "success" : "warning"}>
                  {user.isEmailVerified ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" />
                      Not Verified
                    </>
                  )}
                </Badge>
                <Badge>{user.role}</Badge>
                <Badge variant="outline">{user.provider}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<User className="h-4 w-4" />}
              label="Name"
              value={
                user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.firstName || user.lastName || "Not set"
              }
            />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
            <InfoRow
              icon={<Shield className="h-4 w-4" />}
              label="Role"
              value={user.role}
            />
            <InfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="Member since"
              value={formatDate(user.createdAt)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Founder Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {founder ? (
              <>
                <InfoRow
                  icon={<Building2 className="h-4 w-4" />}
                  label="Company"
                  value={founder.companyName || "Not set"}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Founder since"
                  value={formatDate(founder.createdAt)}
                />
              </>
            ) : (
              <Alert variant="info" title="No founder account">
                <p className="text-sm">
                  Create a waitlist to set up your founder profile.
                </p>
                <Button className="mt-3" onClick={() => router.push(routes.create)}>
                  Create Waitlist
                </Button>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusRow
            title="Email Verification"
            description={
              user.isEmailVerified ? "Your email is verified" : "Your email is not verified"
            }
            badge={user.isEmailVerified ? "Verified" : "Not Verified"}
            variant={user.isEmailVerified ? "success" : "warning"}
          />
          <StatusRow
            title="Two-Factor Authentication"
            description={
              user.isTwoFactorEnabled
                ? "2FA is enabled on your account"
                : "Add an extra layer of security"
            }
            badge={user.isTwoFactorEnabled ? "Enabled" : "Disabled"}
            variant={user.isTwoFactorEnabled ? "success" : "warning"}
          />
          {!user.isEmailVerified && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push(routes.resendVerification)}
            >
              Verify Email
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="capitalize text-foreground">{value}</p>
      </div>
    </div>
  );
}

function StatusRow({
  title,
  description,
  badge,
  variant,
}: {
  title: string;
  description: string;
  badge: string;
  variant: "success" | "warning";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge variant={variant}>{badge}</Badge>
    </div>
  );
}
