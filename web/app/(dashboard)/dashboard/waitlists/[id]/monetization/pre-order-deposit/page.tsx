"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeft, Package, Clock } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import { Badge } from "@/components/ui/badge";

export default function PreOrderDepositPage() {
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
            onClick={() => router.push(routes.waitlistMonetization(waitlistId))}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Monetization
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
              <Package className="h-8 w-8 text-warning" />
              Pre-Order Deposit
            </h1>
            <p className="mt-2 text-muted-foreground">
              Collect deposits from participants to validate purchase intent
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
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Pre-Order Deposit Feature
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Allow participants to place deposits to secure their spot in your waitlist and validate their purchase intent. This feature will help you identify serious buyers and reduce drop-offs.
              </p>
              <div className="space-y-2 text-left max-w-md mx-auto mb-6">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Collect deposits for pre-order product launches
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Set deposit amounts and payment terms
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Track deposit status and collection progress
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Integrate with Stripe and Chapa payments
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push(routes.waitlistMonetization(waitlistId))}
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