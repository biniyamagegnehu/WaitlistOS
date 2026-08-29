"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Trophy, Users, TrendingUp, Gift, Target } from "lucide-react";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { LoadingState } from "@/components/patterns/loading-state";
import { ErrorState } from "@/components/patterns/error-state";
import { MetricCard } from "@/components/patterns/metric-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  getTeamMilestones,
  getTeamAnalytics,
  createTeamMilestone,
  updateTeamMilestone,
  deleteTeamMilestone,
} from "@/services/teams";
import type { TeamMilestoneDto, TeamAnalytics, CreateTeamMilestoneInput } from "@/services/teams";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

const milestoneSchema = z.object({
  milestone: z.coerce
    .number({ message: "Referral milestone is required." })
    .int("Referral milestone must be an integer.")
    .min(5, "Referral milestone must be at least 5."),
  value: z.coerce
    .number({ message: "Ranking bonus is required." })
    .int("Ranking bonus must be an integer.")
    .min(1, "Ranking bonus must be at least 1.")
    .max(100, "Ranking bonus cannot exceed 100."),
  title: z.string().optional(),
});

type MilestoneFormData = z.infer<typeof milestoneSchema>;

export default function TeamMilestonesPage() {
  const params = useParams();
  const router = useRouter();
  const waitlistId = params?.id as string;

  const [milestones, setMilestones] = React.useState<TeamMilestoneDto[]>([]);
  const [analytics, setAnalytics] = React.useState<TeamAnalytics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editingMilestone, setEditingMilestone] = React.useState<TeamMilestoneDto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = React.useState<TeamMilestoneDto | null>(null);

  const form = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema) as any,
    defaultValues: { milestone: 5 as any, value: 1 as any, title: "" },
    mode: "onChange",
  });

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [milestonesRes, analyticsRes] = await Promise.all([
        getTeamMilestones(waitlistId),
        getTeamAnalytics(waitlistId).catch(() => null),
      ]);
      setMilestones(milestonesRes.data);
      if (analyticsRes) setAnalytics(analyticsRes.data);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load team milestones"));
    } finally {
      setIsLoading(false);
    }
  }, [waitlistId]);

  React.useEffect(() => {
    if (waitlistId) loadData();
  }, [waitlistId, loadData]);

  const openCreate = () => {
    setEditingMilestone(null);
    form.reset({ milestone: 5 as any, value: 1 as any, title: "" });
    setIsDialogOpen(true);
  };

  const openEdit = (m: TeamMilestoneDto) => {
    setEditingMilestone(m);
    form.reset({
      milestone: m.milestone,
      value: m.value ?? 1,
      title: m.title ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length > 1 && val.startsWith("0")) {
      val = val.replace(/^0+/, "");
      if (val === "") val = "0";
      e.target.value = val;
    }
  };

  const onSubmit = async (data: MilestoneFormData) => {
    // Duplicate milestone check
    const isDuplicate = milestones.some(m => m.id !== editingMilestone?.id && m.milestone === data.milestone);
    if (isDuplicate) {
      form.setError("milestone", { type: "manual", message: `A milestone for ${data.milestone} referrals already exists.` });
      return;
    }

    // Progressive rewards: earlier milestones must not reward more than this one
    const earlier = milestones.filter(m => m.id !== editingMilestone?.id && m.milestone < data.milestone);
    const highestEarlier = earlier.sort((a, b) => b.milestone - a.milestone)[0];
    if (highestEarlier && data.value < (highestEarlier.value ?? 0)) {
      form.setError("value", { type: "manual", message: "Later milestones should provide equal or greater rewards." });
      return;
    }

    // Later milestones must not reward less than this one
    const later = milestones.filter(m => m.id !== editingMilestone?.id && m.milestone > data.milestone);
    const lowestLater = later.sort((a, b) => a.milestone - b.milestone)[0];
    if (lowestLater && data.value > (lowestLater.value ?? 0)) {
      form.setError("value", { type: "manual", message: "Earlier milestones should provide equal or less rewards." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateTeamMilestoneInput = {
        milestone: data.milestone,
        type: "POSITION_BOOST",
        value: data.value,
        title: data.title || undefined,
      };

      if (editingMilestone) {
        await updateTeamMilestone(waitlistId, editingMilestone.id, payload);
        toast.success("Milestone updated");
      } else {
        await createTeamMilestone(waitlistId, payload);
        toast.success("Milestone created");
      }

      setIsDialogOpen(false);
      await loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save milestone"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!milestoneToDelete) return;
    try {
      await deleteTeamMilestone(waitlistId, milestoneToDelete.id);
      toast.success("Milestone deleted");
      setDeleteDialogOpen(false);
      setMilestoneToDelete(null);
      await loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete milestone"));
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState variant="skeleton" skeletonCount={4} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          title="Failed to load"
          description={error}
          onRetry={loadData}
          onHome={() => router.push(routes.waitlist(waitlistId))}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Team Referral Milestones"
        description="Configure shared rewards that unlock when a team's combined referrals reach a milestone."
        breadcrumbs={[
          { label: "Waitlist", href: routes.waitlist(waitlistId) },
          { label: "Team Milestones" },
        ]}
        primaryAction={
          <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
            Add Milestone
          </Button>
        }
      />

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Total Teams"
            value={analytics.totalTeams}
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard
            label="Active Teams"
            value={analytics.activeTeams}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            label="Team Referrals"
            value={analytics.totalTeamReferrals}
            icon={<Trophy className="h-4 w-4" />}
          />
          <MetricCard
            label="Rewards Granted"
            value={analytics.totalRewardsGranted}
            icon={<Gift className="h-4 w-4" />}
          />
        </div>
      )}

      {/* Top Performing Team */}
      {analytics?.topPerformingTeam && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Top Performing Team</p>
                <p className="font-semibold text-foreground">{analytics.topPerformingTeam.name}</p>
              </div>
            </div>
            <Badge variant="info">{analytics.topPerformingTeam.totalReferrals} referrals</Badge>
          </CardContent>
        </Card>
      )}

      {/* Milestones list */}
      {milestones.length === 0 ? (
        <EmptyState
          title="No team milestones yet"
          description="Add your first team milestone to reward groups of participants who collaborate to refer new users."
          action={
            <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
              Add Milestone
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {[...milestones].sort((a, b) => a.milestone - b.milestone).map((m) => (
            <Card key={m.id}>
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">
                        {m.milestone} Team Referrals
                      </p>
                      {m.title && (
                        <Badge variant="outline" className="text-xs">{m.title}</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Ranking Bonus:{" "}
                      <span className="font-medium text-foreground">+{m.value} positions</span>
                    </p>
                    {m._count && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {m._count.teamMilestoneRewards} team{m._count.teamMilestoneRewards === 1 ? "" : "s"} unlocked
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(m)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setMilestoneToDelete(m); setDeleteDialogOpen(true); }}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* How It Works */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">How Team Milestones Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Participants create or join a team using an invite code.</p>
          <p>2. Every member continues using their own personal referral link.</p>
          <p>3. The team's score = sum of all members' individual referral counts.</p>
          <p>4. When the team's score reaches a milestone, every current member receives the configured ranking bonus.</p>
          <p>5. Each milestone can only be unlocked once per team. Late joiners are not eligible for past milestones.</p>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMilestone ? "Edit Milestone" : "Add Team Milestone"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Required Team Referrals
                </label>
                <Input
                  type="number"
                  min={5}
                  inputMode="numeric"
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="e.g. 50"
                  {...form.register("milestone")}
                  onChange={(e) => {
                    handleNumericInput(e);
                    form.register("milestone").onChange(e);
                  }}
                />
                <p className="text-xs text-muted-foreground">Minimum: 5 referrals. Must not duplicate an existing milestone.</p>
                {form.formState.errors.milestone && (
                  <p className="text-xs text-destructive">{form.formState.errors.milestone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Ranking Bonus (+positions)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  inputMode="numeric"
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="e.g. 8"
                  {...form.register("value")}
                  onChange={(e) => {
                    handleNumericInput(e);
                    form.register("value").onChange(e);
                  }}
                />
                {form.formState.errors.value && (
                  <p className="text-xs text-destructive">{form.formState.errors.value.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Label <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  placeholder="e.g. Early Adopter Bonus"
                  {...form.register("title")}
                />
              </div>

              <div className="rounded-lg border border-border bg-surface p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Preview</p>
                <p>
                  When a team reaches{" "}
                  <strong className="text-foreground">{form.watch("milestone") || "?"}</strong> combined referrals,
                  every member earns{" "}
                  <strong className="text-foreground">+{form.watch("value") || "?"} ranking bonus</strong>.
                </p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : editingMilestone ? "Save Changes" : "Add Milestone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team Milestone</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the{" "}
              <strong className="text-foreground">{milestoneToDelete?.milestone} referrals</strong> milestone?
              This action cannot be undone.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
