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

export default function SessionsPage() {
  const router = useRouter();
  const { toast } = useToast();
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
      toast({
        title: "Session revoked successfully",
        variant: "success",
      });
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
    if (!confirm("Are you sure you want to revoke all other sessions? This will sign you out from all other devices.")) {
      return;
    }

    try {
      setIsRevoking(true);
      await revokeAllSessions();
      toast({
        title: "All sessions revoked successfully",
        variant: "success",
      });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    
    if (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone")) {
      return <Monitor className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

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

  const currentSession = sessions.find(s => s.isCurrent);
  const otherSessions = sessions.filter(s => !s.isCurrent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Active Sessions</h1>
          <p className="text-zinc-400 mt-1">
            Manage your active sessions across devices
          </p>
        </div>
        {otherSessions.length > 0 && (
          <Button
            variant="danger"
            onClick={handleRevokeAll}
            loading={isRevoking}
          >
            Revoke All Other Sessions
          </Button>
        )}
      </div>

      {/* Current Session */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-500/10 p-3 rounded-xl">
                  {getDeviceIcon(currentSession.userAgent)}
                </div>
                <div>
                  <p className="text-white font-medium">This device</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-zinc-400">
                    <MapPin className="h-3 w-3" />
                    <span>{currentSession.ipAddress || "Unknown location"}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-zinc-400">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(currentSession.createdAt)}</span>
                  </div>
                  <div className="mt-2">
                    <Badge variant="success">Active now</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Sessions */}
      {otherSessions.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Other Sessions</h2>
          {otherSessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="bg-white/5 p-3 rounded-xl">
                      {getDeviceIcon(session.userAgent)}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {session.deviceInfo || "Unknown device"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-zinc-400">
                        <MapPin className="h-3 w-3" />
                        <span>{session.ipAddress || "Unknown location"}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-zinc-400">
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
          <p className="text-sm">
            You are only signed in on this device.
          </p>
        </Alert>
      )}

      {/* Sign Out Everywhere */}
      <Card className="border-red-500/25">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-red-500/10 p-3 rounded-xl">
              <LogOut className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">Sign out everywhere</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Sign out from all devices including this one. You will need to sign in again to access your account.
              </p>
              <Button
                variant="danger"
                className="mt-4"
                onClick={() => {
                  if (confirm("Are you sure you want to sign out from all devices?")) {
                    router.push("/login");
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
