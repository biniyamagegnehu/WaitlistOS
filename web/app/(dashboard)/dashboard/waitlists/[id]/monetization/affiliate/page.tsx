"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeft, Users, Clock } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import { Badge } from "@/components/ui/badge";

export default function AffiliateProgramPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const waitlistId = params?.id as string;

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(routes.monetization)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Monetization
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
              <Users className="h-8 w-8 text-info" />
              Affiliate Program
            </h1>
            <p className="mt-2 text-muted-foreground">
              Turn your WaitlistOS experience into a referral channel
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Coming Soon</CardTitle>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                In Development
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Affiliate Program Feature
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create an affiliate program to incentivize users to promote your waitlist. Track referrals, manage commissions, and grow your community through word-of-mouth marketing.
              </p>
              <div className="space-y-2 text-left max-w-md mx-auto mb-6">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Set commission rates and payout structures
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Generate unique affiliate links and codes
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Track clicks, conversions, and earnings
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Manage affiliate payouts and reports
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push(routes.monetization)}
              >
                Back to Monetization Overview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}