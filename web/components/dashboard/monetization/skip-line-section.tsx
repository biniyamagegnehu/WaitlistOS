"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DollarSign, ArrowRight, Zap, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { api } from "@/lib/axios";

interface WaitlistSkipLineSummary {
  id: string;
  name: string;
  totalParticipants: number;
  skipLineEnabled: boolean;
  skipLineRevenue: number;
  skipLinePaidParticipants: number;
}

export function SkipLineSection() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [summaries, setSummaries] = React.useState<WaitlistSkipLineSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetch = async () => {
      try {
        const { data: waitlists } = await api.get("/dashboard/waitlists");
        const results = await Promise.all(
          (waitlists || []).map(async (w: any) => {
            try {
              const { data } = await api.get(`/monetization/skip-line/analytics/${w.id}`);
              return {
                id: w.id,
                name: w.name,
                totalParticipants: w.totalParticipants || 0,
                skipLineEnabled: data.skipLineEnabled || false,
                skipLineRevenue: data.totalRevenue || 0,
                skipLinePaidParticipants: data.paidParticipants || 0,
              };
            } catch {
              return {
                id: w.id,
                name: w.name,
                totalParticipants: w.totalParticipants || 0,
                skipLineEnabled: false,
                skipLineRevenue: 0,
                skipLinePaidParticipants: 0,
              };
            }
          })
        );
        setSummaries(results);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load Skip the Line data"));
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-muted" />
        ))}
      </div>
    );
  }

  const totalRevenue = summaries.reduce((s, x) => s + x.skipLineRevenue, 0);
  const totalPaid = summaries.reduce((s, x) => s + x.skipLinePaidParticipants, 0);
  const activeCount = summaries.filter((x) => x.skipLineEnabled).length;

  return (
    <div className="space-y-6 pt-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" /> Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" /> Paid Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPaid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Zap className="h-4 w-4" /> Active Waitlists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
      </div>

      {summaries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Zap className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No waitlists yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a waitlist to enable Skip the Line on it.
              </p>
            </div>
            <Button onClick={() => router.push(routes.create)}>Create Waitlist</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {summaries.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.name}</p>
                  <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
                    <span>{s.totalParticipants} participants</span>
                    {s.skipLineEnabled && (
                      <>
                        <span>·</span>
                        <span>{s.skipLinePaidParticipants} paid</span>
                        <span>·</span>
                        <span>${s.skipLineRevenue.toFixed(2)} revenue</span>
                      </>
                    )}
                  </div>
                  <span className={s.skipLineEnabled ? "text-xs text-success" : "text-xs text-muted-foreground"}>
                    {s.skipLineEnabled ? "Skip the Line Active" : "Not configured"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4 shrink-0 gap-2"
                  onClick={() => router.push(routes.waitlistMonetization(s.id) + "/skip-line")}
                >
                  Configure <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
