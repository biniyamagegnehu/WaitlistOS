"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, Calendar, Building2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { useCurrentUser } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";

export default function ProfilePage() {
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

  if (!user) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Profile</h1>
        <p className="text-zinc-400 mt-1">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <div className="h-full w-full bg-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
                {getInitials(user.firstName, user.lastName, user.email)}
              </div>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email}
              </h2>
              <p className="text-zinc-400 mt-1">{user.email}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant={user.isEmailVerified ? "success" : "warning"}>
                  {user.isEmailVerified ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Verified
                    </>
                  )}
                </Badge>
                <Badge>{user.role}</Badge>
                <Badge variant="outline">{user.provider}</Badge>
              </div>
            </div>
            <Button variant="secondary" onClick={() => router.push(routes.security)}>
              Security Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-sm text-zinc-400">Name</p>
                <p className="text-white">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : "Not set"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-sm text-zinc-400">Email</p>
                <p className="text-white">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-sm text-zinc-400">Role</p>
                <p className="text-white capitalize">{user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-sm text-zinc-400">Member since</p>
                <p className="text-white">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Founder Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {founder ? (
              <>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-zinc-500" />
                  <div>
                    <p className="text-sm text-zinc-400">Company</p>
                    <p className="text-white">
                      {founder.companyName || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  <div>
                    <p className="text-sm text-zinc-400">Founder since</p>
                    <p className="text-white">{formatDate(founder.createdAt)}</p>
                  </div>
                </div>
              </>
            ) : (
              <Alert variant="info" title="No founder account">
                <p className="text-sm">
                  You do not have a founder account yet. Create one to start building your waitlist.
                </p>
                <Button
                  className="mt-3"
                  onClick={() => router.push(routes.create)}
                >
                  Create Waitlist
                </Button>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle>Security Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Email Verification</p>
              <p className="text-sm text-zinc-400">
                {user.isEmailVerified
                  ? "Your email is verified"
                  : "Your email is not verified"}
              </p>
            </div>
            <Badge variant={user.isEmailVerified ? "success" : "warning"}>
              {user.isEmailVerified ? "Verified" : "Not Verified"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-zinc-400">
                {user.isTwoFactorEnabled
                  ? "2FA is enabled on your account"
                  : "Add an extra layer of security"}
              </p>
            </div>
            <Badge variant={user.isTwoFactorEnabled ? "success" : "warning"}>
              {user.isTwoFactorEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
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
