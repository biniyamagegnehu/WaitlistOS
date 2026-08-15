'use client';

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { getParticipantDetail } from "@/services/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Trophy, Share2, Award, Zap, Users, Info } from "lucide-react";
import { getCountryName, getLanguageName } from "@/lib/locale-data";

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'WAITING':
      return 'outline';
    case 'INVITED':
      return 'primary';
    case 'ACCESSED':
      return 'success';
    default:
      return 'outline';
  }
}

function formatDate(dateStr: string | Date) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderFieldValue(fieldDef: any, value: any) {
  if (value === undefined || value === null || value === "") {
    return <span className="text-muted-foreground italic">Not answered</span>;
  }

  switch (fieldDef.type) {
    case "BOOLEAN":
      return value ? "Yes" : "No";
    case "COUNTRY":
      return getCountryName(value);
    case "LANGUAGE":
      return getLanguageName(value);
    case "MULTI_SELECT":
      if (Array.isArray(value)) {
        return (
          <div className="flex flex-wrap gap-1 mt-1">
            {value.map((v: string) => {
              const option = fieldDef.options?.find((o: any) => o.value === v);
              return (
                <Badge key={v} variant="outline">
                  {option ? option.label : v}
                </Badge>
              );
            })}
          </div>
        );
      }
      return String(value);
    case "SINGLE_SELECT":
    case "DROPDOWN":
      const option = fieldDef.options?.find((o: any) => o.value === value);
      return option ? option.label : String(value);
    case "URL":
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {value}
        </a>
      );
    case "RATING":
      return (
        <div className="flex items-center gap-1">
          <span className="font-medium">{value}</span>
          <span className="text-muted-foreground text-sm">/ 5</span>
          <div className="flex ml-2">
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} className={star <= Number(value) ? "text-accent" : "text-muted"}>★</span>
            ))}
          </div>
        </div>
      );
    case "CONSENT":
      return value ? "Granted" : "Not granted";
    case "DATE":
    case "DATE_TIME":
      return new Date(value).toLocaleDateString();
    case "LONG_TEXT":
      return <p className="whitespace-pre-wrap">{String(value)}</p>;
    default:
      return String(value);
  }
}

export default function ParticipantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const waitlistId = params.id as string;
  const participantId = params.participantId as string;

  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getParticipantDetail(waitlistId, participantId);
        setData(res);
      } catch (err: any) {
        setError(err.response?.data?.message || "Participant not found or you are not authorized.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [waitlistId, participantId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <Button variant="ghost" disabled className="mb-4 -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Participants
          </Button>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !data?.participant) {
    return (
      <div className="space-y-4 max-w-lg mx-auto mt-12 text-center">
        <h2 className="text-xl font-semibold">Participant not found</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Participants
        </Button>
      </div>
    );
  }

  const { participant, signupConfig } = data;
  
  // Create a map of active field definitions
  const fieldDefs = new Map();
  if (signupConfig?.steps) {
    const steps = typeof signupConfig.steps === "string" ? JSON.parse(signupConfig.steps) : signupConfig.steps;
    steps.forEach((step: any) => {
      step.fields?.forEach((field: any) => {
        fieldDefs.set(field.id, field);
      });
    });
  }

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-4 -ml-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Participants
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {participant.email}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-muted-foreground">
              <Badge variant={getStatusBadgeVariant(participant.status) as any}>
                {participant.status}
              </Badge>
              <span className="text-sm">Joined {formatDate(participant.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Core Info & Growth */}
        <div className="lg:col-span-1 space-y-6">
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                Participant Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{participant.email}</p>
              </div>
              <div className="h-px bg-border my-4" />
              <div>
                <p className="text-sm text-muted-foreground">Referral Code</p>
                <p className="font-medium font-mono bg-muted inline-block px-2 py-0.5 rounded text-sm mt-1">
                  {participant.referralCode}
                </p>
              </div>
              {participant.referredBy && (
                <>
                  <div className="h-px bg-border my-4" />
                  <div>
                    <p className="text-sm text-muted-foreground">Referred By</p>
                    <p className="font-medium">{participant.referredBy.email}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-muted-foreground" />
                Ranking & Growth
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Position</p>
                  <p className="text-2xl font-bold">#{participant.position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-bold">{participant.referralCount}</p>
                </div>
              </div>
              <div className="h-px bg-border my-4" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Position Boost</p>
                  <p className="font-medium text-success">+{participant.positionBoostBonus}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="font-medium flex items-center gap-1">
                    {participant.currentStreak > 0 ? (
                      <>🔥 {participant.currentStreak} days</>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {participant.team && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Team Name</p>
                  <p className="font-medium">{participant.team.name}</p>
                </div>
                <div className="h-px bg-border my-4" />
                <div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="font-medium">{participant.team._count.members}</p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Column: Custom Fields, Referrals, Rewards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Custom Signup Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-muted-foreground" />
                Signup Information
              </CardTitle>
              <CardDescription>Answers submitted during the multi-step signup process.</CardDescription>
            </CardHeader>
            <CardContent>
              {participant.customFields && Object.keys(participant.customFields).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(participant.customFields).map(([fieldId, answer]: [string, any]) => {
                    const fieldDef = fieldDefs.get(fieldId);
                    
                    if (!fieldDef) {
                      // Archived or removed field
                      return (
                        <div key={fieldId} className="border-l-2 border-muted pl-4 py-1">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            Archived Field
                          </p>
                          <div className="mt-1">{String(answer)}</div>
                        </div>
                      );
                    }

                    // For long text, stack. For others, flex row if possible
                    const isLongText = fieldDef.type === "LONG_TEXT";

                    return (
                      <div key={fieldId} className={isLongText ? "space-y-2" : "grid sm:grid-cols-3 gap-2 sm:gap-4 py-3 border-b last:border-0"}>
                        <p className="text-sm font-medium text-muted-foreground sm:col-span-1">
                          {fieldDef.label}
                        </p>
                        <div className={`sm:col-span-2 ${isLongText ? "bg-muted/30 p-3 rounded-md text-sm" : "font-medium"}`}>
                          {renderFieldValue(fieldDef, answer)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  No custom fields submitted.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rewards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-muted-foreground" />
                Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participant.participantRewards?.length === 0 && participant.participantStreakRewards?.length === 0 ? (
                <p className="text-muted-foreground">No rewards unlocked yet.</p>
              ) : (
                <div className="space-y-4">
                  {/* Standard Milestone Rewards */}
                  {participant.participantRewards?.map((pr: any) => (
                    <div key={pr.id} className="flex items-start gap-3 p-3 rounded-lg border bg-surface-muted">
                      <div className="bg-primary/10 text-primary p-2 rounded-full mt-0.5">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{pr.reward.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {pr.reward.milestone} Referrals • Unlocked {new Date(pr.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Streak Rewards */}
                  {participant.participantStreakRewards?.map((sr: any) => (
                    <div key={sr.id} className="flex items-start gap-3 p-3 rounded-lg border bg-surface-muted">
                      <div className="bg-accent/10 text-accent p-2 rounded-full mt-0.5">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{sr.streakMilestone.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {sr.streakMilestone.days} Day Streak • Unlocked {new Date(sr.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referral Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-muted-foreground" />
                Referred Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participant.referrals?.length === 0 ? (
                <p className="text-muted-foreground">No referred participants.</p>
              ) : (
                <div className="space-y-2">
                  {participant.referrals?.map((ref: any) => (
                    <div key={ref.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="font-medium text-sm">{ref.email}</span>
                      <span className="text-xs text-muted-foreground">{new Date(ref.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
