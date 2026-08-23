"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { XCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SkipLineCancelContent() {
  const router = useRouter();

  const handleReturn = () => {
    // Try to get the waitlist from sessionStorage or return to home
    const waitlistSlug = sessionStorage.getItem("lastWaitlistSlug");
    if (waitlistSlug) {
      router.push(`/w/${waitlistSlug}`);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-6 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Payment Cancelled
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Skip the Line payment was cancelled. No charges were made.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 text-left w-full">
            <p className="text-sm text-muted-foreground">
              You can try again anytime if you'd like to move into the priority group.
            </p>
          </div>

          <Button onClick={handleReturn} variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Waitlist
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}