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
import { ReferralSharePreview } from "@/components/waitlist/ReferralSharePreview";
import { getShareableReferralUrl } from "@/lib/referral";
import { ReferralMessages } from "@/components/waitlist/ReferralMessages";

export default function PublicWaitlistPageClient() {
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
    navigator.clipboard.writeText(link).then(() => {
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

  const { waitlist, branding, copy } = waitlistData;
  const primaryColor = branding?.primaryColor ?? "var(--primary)";

  if (joined) {
    const fullReferralLink = getShareableReferralUrl(joined.referralCode, window.location.origin);

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
              Share preview
            </p>
            <ReferralSharePreview
              referralCode={joined.referralCode}
              productName={waitlist.name}
            />
          </CardContent>
        </Card>

        {waitlist.rewards && waitlist.rewards.length > 0 && (
          <Card>
            <CardContent className="space-y-4 p-5 text-left">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Rewards
              </p>
              
              <div className="space-y-3">
                {waitlist.rewards.map(reward => {
                  const isUnlocked = joined.referralCount >= reward.milestone;
                  return (
                    <div key={reward.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface">
                      <div className="mt-0.5">
                        <CheckCircle className={`h-5 w-5 ${isUnlocked ? 'text-success' : 'text-muted-foreground/30'}`} />
                      </div>
                      <div>
                        <p className={`font-medium ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {reward.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Refer {reward.milestone} people
                        </p>
                        {reward.description && (
                          <p className="mt-1 text-sm text-muted-foreground/80">{reward.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const unachieved = waitlist.rewards.filter(r => r.milestone > joined.referralCount);
                const nextTarget = unachieved.length > 0 ? unachieved[0].milestone : waitlist.rewards[waitlist.rewards.length - 1].milestone;
                const percent = Math.min(Math.round((joined.referralCount / nextTarget) * 100), 100);
                
                return (
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress to next reward</span>
                      <span className="font-medium text-foreground">{joined.referralCount} / {nextTarget}</span>
                    </div>
                    <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: primaryColor }}
                      />
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-3 p-5 text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Share to move up
            </p>
            <p className="break-all font-mono text-sm text-foreground">{fullReferralLink}</p>
            <Button
              onClick={() => handleCopy(fullReferralLink)}
              className="w-full"
              style={{ backgroundColor: primaryColor }}
            >
              {copied ? "Copied!" : "Copy referral link"}
            </Button>
          </CardContent>
        </Card>

        {/* AI Referral Messages */}
        <ReferralMessages participantId={joined.id} primaryColor={primaryColor} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-16">
      {/* Section 1: Hero Card */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-8 text-center space-y-6">
          {branding?.logoUrl && (
            <div className="flex justify-center">
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
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">{waitlist.name}</h1>
            <p className="text-lg font-medium text-muted-foreground">{waitlist.tagline}</p>
          </div>
          {waitlist.description && (
            <p className="mx-auto max-w-xl text-sm text-muted-foreground leading-relaxed">
              {waitlist.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Marketing Content */}
      {copy && (
        <div className="text-center space-y-6 py-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{copy.headline}</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{copy.subheadline}</p>
          <Button 
            size="lg" 
            className="mt-4 rounded-full px-8 font-semibold shadow-sm hover:opacity-90"
            style={{ backgroundColor: "#1f5c42" }}
            onClick={() => document.getElementById('join-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {copy.cta}
          </Button>
        </div>
      )}

      {/* Section 3: Features */}
      {copy?.features && copy.features.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-3 py-8">
          {copy.features.map((feature, idx) => (
            <Card key={idx} className="bg-surface shadow-sm border-border/50">
              <CardContent className="p-6 space-y-3 text-center sm:text-left">
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Section 4: FAQs */}
      {copy?.faqs && copy.faqs.length > 0 && (
        <div className="py-8 space-y-6">
          <h3 className="text-2xl font-bold tracking-tight text-center mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {copy.faqs.map((faq, idx) => (
              <details key={idx} className="group rounded-lg border border-border bg-surface p-4 shadow-sm transition-all [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground">
                  {faq.question}
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Section 5: Join Waitlist Form */}
      <Card id="join-form" className="shadow-sm border-border/50">
        <CardContent className="p-8 text-center space-y-6">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Join the Waitlist</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {refCode
                ? "You were referred! Join now to secure your spot."
                : "Enter your email to secure your spot in line."}
            </p>
          </div>
          <JoinWaitlistForm
            waitlistSlug={slug}
            referralCode={refCode}
            onSuccess={(data) => setJoined(data)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
