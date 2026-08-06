"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Edit2, Trash2, Trophy, Users, TrendingUp, Gift, Target } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  milestone: z.string().min(1, "Referral count is required"),
  value: z.string().min(1, "Ranking bonus is required"),
  title: z.string().optional(),
});

type MilestoneFormData = z.infer<typeof milestoneSchema>;

export default function TeamMilestonesPage() {
  const params = useParams();
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
    resolver: zodResolver(milestoneSchema),
    defaultValues: { milestone: "", value: "", title: "" },
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
    form.reset({ milestone: "", value: "", title: "" });
    setIsDialogOpen(true);
  };

  const openEdit = (m: TeamMilestoneDto) => {
    setEditingMilestone(m);
    form.reset({
      milestone: String(m.milestone),
      value: String(m.value ?? ""),
      title: m.title ?? "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: MilestoneFormData) => {
    setIsSubmitting(true);
    try {
      const payload: CreateTeamMilestoneInput = {
        milestone: Number(data.milestone),
        type: "POSITION_BOOST",
        value: Number(data.value),
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
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-10 w-72" />
        <Skeleton variant="rectangular" className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load"
        description={error}
        action={
          <Link href={routes.waitlist(waitlistId)}>
            <Button variant="secondary">Back to Waitlist</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={routes.waitlist(waitlistId)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Waitlist
      </Link>

      <SectionHeader
        title="Team Referral Milestones"
        description="Configure shared rewards that unlock when a team's combined referrals reach a milestone."
        action={
          <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
            Add Milestone
          </Button>
        }
      />

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AnalyticStat icon={<Users className="h-4 w-4" />} label="Total Teams" value={analytics.totalTeams} />
          <AnalyticStat icon={<TrendingUp className="h-4 w-4" />} label="Active Teams" value={analytics.activeTeams} />
          <AnalyticStat icon={<Trophy className="h-4 w-4" />} label="Team Referrals" value={analytics.totalTeamReferrals} />
          <AnalyticStat icon={<Gift className="h-4 w-4" />} label="Rewards Granted" value={analytics.totalRewardsGranted} />
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
          {milestones.map((m) => (
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
                  min={1}
                  placeholder="e.g. 50"
                  {...form.register("milestone")}
                />
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
                  placeholder="e.g. 8"
                  {...form.register("value")}
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
    </div>
  );
}

function AnalyticStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
