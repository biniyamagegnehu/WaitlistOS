"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Package, ArrowRight, DollarSign, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { api } from "@/lib/axios";

interface WaitlistPreOrderSummary {
  id: string;
  name: string;
  totalParticipants: number;
  preOrderEnabled: boolean;
  preOrderRevenue: number;
  preOrderDeposits: number;
}

export function PreOrderSection() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [summaries, setSummaries] = React.useState<WaitlistPreOrderSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetch = async () => {
      try {
        const { data: waitlists } = await api.get("/dashboard/waitlists");
        const results = await Promise.all(
          (waitlists || []).map(async (w: any) => {
            try {
              const { data } = await api.get(`/monetization/pre-order/analytics/${w.id}`);
              return {
                id: w.id,
                name: w.name,
                totalParticipants: w.totalParticipants || 0,
                preOrderEnabled: data.preOrderEnabled || false,
                preOrderRevenue: data.totalRevenue || 0,
                preOrderDeposits: data.totalDeposits || 0,
              };
            } catch {
              return {
                id: w.id,
                name: w.name,
                totalParticipants: w.totalParticipants || 0,
                preOrderEnabled: false,
                preOrderRevenue: 0,
                preOrderDeposits: 0,
              };
            }
          })
        );
        setSummaries(results);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load Pre-Order data"));
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

  const totalRevenue = summaries.reduce((s, x) => s + x.preOrderRevenue, 0);
  const totalDeposits = summaries.reduce((s, x) => s + x.preOrderDeposits, 0);
  const activeCount = summaries.filter((x) => x.preOrderEnabled).length;

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
              <Package className="h-4 w-4" /> Total Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalDeposits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" /> Active Waitlists
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
            <Package className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No waitlists yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a waitlist to enable Pre-Order Deposit on it.
              </p>
            </div>
            <Button onClick={() => router.push(routes.waitlists)}>Go to Waitlists</Button>
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
                    {s.preOrderEnabled && (
                      <>
                        <span>·</span>
                        <span>{s.preOrderDeposits} deposits</span>
                        <span>·</span>
                        <span>${s.preOrderRevenue.toFixed(2)} revenue</span>
                      </>
                    )}
                  </div>
                  <span className={s.preOrderEnabled ? "text-xs text-success" : "text-xs text-muted-foreground"}>
                    {s.preOrderEnabled ? "Pre-Order Active" : "Not configured"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4 shrink-0 gap-2"
                  onClick={() =>
                    router.push(routes.waitlistMonetization(s.id) + "/pre-order")
                  }
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
