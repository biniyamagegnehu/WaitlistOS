"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Monitor, MapPin, Calendar, Trash2, LogOut } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessions, revokeSession, revokeAllSessions } from "@/services/auth";
import { Session } from "@/types/auth";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuth } from "@/contexts/auth-context";
import { routes } from "@/lib/routes";

export function SessionsSettingsSection() {
  const router = useRouter();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRevoking, setIsRevoking] = React.useState(false);

  const fetchSessions = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSessions();
      setSessions(data);
    } catch (error: unknown) {
      toast({
        title: getApiErrorMessage(error, "Failed to fetch sessions"),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSessions();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setIsRevoking(true);
      await revokeSession(sessionId);
      toast({ title: "Session revoked successfully", variant: "success" });
      await fetchSessions();
    } catch (error: unknown) {
      toast({
        title: getApiErrorMessage(error, "Failed to revoke session"),
        variant: "error",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRevokeAll = async () => {
    if (
      !confirm(
        "Are you sure you want to revoke all other sessions? This will sign you out from all other devices."
      )
    ) {
      return;
    }

    try {
      setIsRevoking(true);
      await revokeAllSessions();
      toast({ title: "All sessions revoked successfully", variant: "success" });
      await fetchSessions();
    } catch (error: unknown) {
      toast({
        title: getApiErrorMessage(error, "Failed to revoke sessions"),
        variant: "error",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-32" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="space-y-6">
      {otherSessions.length > 0 && (
        <div className="flex justify-end">
          <Button variant="danger" onClick={handleRevokeAll} loading={isRevoking}>
            Revoke all other sessions
          </Button>
        </div>
      )}

      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="rounded-md bg-primary/10 p-3 text-primary">
                <Monitor className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">This device</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{currentSession.ipAddress || "Unknown location"}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(currentSession.createdAt)}</span>
                </div>
                <div className="mt-2">
                  <Badge variant="success">Active now</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {otherSessions.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Other Sessions</h2>
          {otherSessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-md bg-surface-muted p-3 text-muted-foreground">
                      <Monitor className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {session.deviceInfo || "Unknown device"}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{session.ipAddress || "Unknown location"}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Last active: {formatDate(session.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                    loading={isRevoking}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert variant="info" title="No other active sessions">
          <p className="text-sm">You are only signed in on this device.</p>
        </Alert>
      )}

      <Card className="border-destructive/25">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-md bg-destructive/10 p-3">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Sign out everywhere</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign out from all devices including this one. You will need to sign in again to
                access your account.
              </p>
              <Button
                variant="danger"
                className="mt-4"
                onClick={async () => {
                  if (confirm("Are you sure you want to sign out from all devices?")) {
                    await revokeAllSessions();
                    await logout();
                    router.replace(routes.login);
                  }
                }}
              >
                Sign out everywhere
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
