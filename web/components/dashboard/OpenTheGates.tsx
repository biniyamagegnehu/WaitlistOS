'use client';

import { useState, useEffect } from 'react';
import { cohortsService, CohortAnalytics, Cohort } from '@/services/cohorts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, Send, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface OpenTheGatesProps {
  waitlistId: string;
}

export function OpenTheGates({ waitlistId }: OpenTheGatesProps) {
  const [analytics, setAnalytics] = useState<CohortAnalytics | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [batchSize, setBatchSize] = useState<string>('100');

  useEffect(() => {
    loadData();
  }, [waitlistId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, cohortsRes] = await Promise.all([
        cohortsService.getAnalytics(waitlistId),
        cohortsService.getCohorts(waitlistId),
      ]);
      setAnalytics(analyticsRes.data);
      setCohorts(cohortsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGates = async () => {
    const size = parseInt(batchSize);

    if (!size || size <= 0) {
      toast.error('Please enter a valid batch size');
      return;
    }

    if (size > (analytics?.waitingParticipants || 0)) {
      toast.error(`Cannot invite more than ${analytics?.waitingParticipants} waiting participants`);
      return;
    }

    setOpening(true);
    try {
      const result = await cohortsService.openGates({
        waitlistId,
        batchSize: size,
      });

      toast.success(`Successfully invited ${result.data.invitedCount} participants!`);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to open gates');
    } finally {
      setOpening(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">Failed to load analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{analytics.totalParticipants.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Invited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{analytics.invitedParticipants.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold">{analytics.waitingParticipants.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{analytics.progress.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invitation Progress</span>
              <span className="font-medium">{analytics.progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted h-2">
              <div
                className="bg-primary h-2 transition-all"
                style={{ width: `${analytics.progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{analytics.invitedParticipants} invited</span>
              <span>{analytics.totalParticipants} total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Gates Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Open The Gates</CardTitle>
          <CardDescription>Invite participants from your waitlist in batches</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Batch Size</p>
            <Input
              type="number"
              placeholder="Enter number of participants"
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value)}
              min="1"
              max={analytics.waitingParticipants}
            />
            <p className="text-xs text-muted-foreground">
              Maximum: {analytics.waitingParticipants} waiting participants
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleOpenGates}
              disabled={opening || analytics.waitingParticipants === 0}
              className="flex-1"
            >
              {opening ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Gates...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Open The Gates
                </>
              )}
            </Button>

            {analytics.waitingParticipants === 0 && (
              <p className="text-sm text-muted-foreground">No waiting participants</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cohort History */}
      <Card>
        <CardHeader>
          <CardTitle>Cohort History</CardTitle>
          <CardDescription>Track all gate openings and invited cohorts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {cohorts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No cohorts created yet</p>
              ) : (
                <div className="space-y-3">
                  {cohorts.map((cohort) => (
                    <div key={cohort.id} className="flex items-center justify-between p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Cohort #{cohort.batchNumber}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(cohort.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{cohort.size} participants invited</p>
                      </div>
                      <Badge variant="outline">{cohort.invitations.length} invitations</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {cohorts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No cohorts created yet</p>
              ) : (
                cohorts.map((cohort) => (
                  <div key={cohort.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Cohort #{cohort.batchNumber}</h4>
                      <span className="text-sm text-muted-foreground">
                        {new Date(cohort.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="divide-y">
                      {cohort.invitations.map((invitation) => (
                        <div key={invitation.id} className="flex items-center justify-between p-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{invitation.participant.email}</p>
                            <p className="text-xs text-muted-foreground">Position #{invitation.participant.position}</p>
                          </div>
                          <Badge
                            variant={
                              invitation.participant.status === 'ACCESSED'
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {invitation.participant.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
