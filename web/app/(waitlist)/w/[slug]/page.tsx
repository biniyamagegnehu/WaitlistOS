"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import JoinWaitlistForm from "@/components/waitlist/JoinWaitlistForm";
import { getPublicWaitlistBySlug } from "@/services/api";
import { JoinResponse } from "@/types/participant";
import type { PublicWaitlistResponse } from "@/types/waitlist";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loader";

export default function PublicWaitlistPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const refCode = searchParams?.get("ref") ?? undefined;

  const [waitlistData, setWaitlistData] = useState<PublicWaitlistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joined, setJoined] = useState<JoinResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getPublicWaitlistBySlug(slug)
      .then((data) => {
        if (!data) setNotFound(true);
        else setWaitlistData(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopy = (link: string) => {
    const full = `${window.location.origin}${link}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-5 w-5 text-primary" />
      </div>
    );
  }

  if (notFound || !waitlistData) {
    return (
      <div className="py-20 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Waitlist not found</h1>
        <p className="text-sm text-muted-foreground">
          The waitlist <strong className="text-foreground">{slug}</strong> does not exist.
        </p>
      </div>
    );
  }

  const { waitlist, branding } = waitlistData;
  const primaryColor = branding?.primaryColor ?? "var(--primary)";

  if (joined) {
    const fullReferralLink = `${typeof window !== "undefined" ? window.location.origin : ""}${joined.referralLink}`;

    return (
      <div className="w-full space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>

        <div>
          <h1 className="mb-1 text-2xl font-semibold text-foreground">
            You joined {waitlist.name}!
          </h1>
          <p className="text-sm text-muted-foreground">{joined.email}</p>
        </div>

        <div className="flex gap-4">
          <Card className="flex-1">
            <CardContent className="py-6 text-center">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your Position
              </p>
              <p className="text-4xl font-semibold text-foreground">#{joined.position}</p>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="py-6 text-center">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Referrals
              </p>
              <p className="text-4xl font-semibold text-foreground">{joined.referralCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="space-y-3 p-5 text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Share to move up
            </p>
            <p className="break-all font-mono text-sm text-foreground">{fullReferralLink}</p>
            <Button
              onClick={() => handleCopy(joined.referralLink)}
              className="w-full"
              style={{ backgroundColor: primaryColor }}
            >
              {copied ? "Copied!" : "Copy referral link"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      {branding?.logoUrl && (
        <div className="mb-6 flex justify-center">
          <Image
            src={branding.logoUrl}
            alt={`${waitlist.name} logo`}
            width={80}
            height={80}
            unoptimized
            className="h-20 w-20 rounded-lg border border-border object-cover"
          />
        </div>
      )}

      <h1 className="mb-2 text-3xl font-semibold text-foreground">{waitlist.name}</h1>
      <p className="mb-2 text-muted-foreground">{waitlist.tagline}</p>
      {waitlist.description && (
        <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground">
          {waitlist.description}
        </p>
      )}
      {!waitlist.description && <div className="mb-8" />}

      <p className="mb-6 text-sm text-muted-foreground">
        {refCode
          ? "You were referred! Join now to secure your spot."
          : "Join the waitlist and secure your spot."}
      </p>

      <JoinWaitlistForm
        waitlistSlug={slug}
        referralCode={refCode}
        onSuccess={(data) => setJoined(data)}
      />
    </div>
  );
}
