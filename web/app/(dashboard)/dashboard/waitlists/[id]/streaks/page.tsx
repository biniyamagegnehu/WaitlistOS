"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Edit2, Trash2 } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getStreakMilestones, getStreakAnalytics, createStreakMilestone, updateStreakMilestone, deleteStreakMilestone } from "@/services/streak-milestones";
import type { StreakMilestoneDto, StreakAnalytics, CreateStreakMilestoneInput } from "@/services/streak-milestones";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

const streakMilestoneSchema = z.object({
  days: z.string().min(1, "Days is required"),
  title: z.string().min(1, "Title is required"),
  value: z.string().min(1, "Position Boost Value is required"),
  description: z.string().optional(),
});

type StreakMilestoneFormData = z.infer<typeof streakMilestoneSchema>;

export default function StreakMilestonesPage() {
  const params = useParams();
  const waitlistId = params?.id as string;

  const [milestones, setMilestones] = React.useState<StreakMilestoneDto[]>([]);
  const [analytics, setAnalytics] = React.useState<StreakAnalytics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editingMilestone, setEditingMilestone] = React.useState<StreakMilestoneDto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = React.useState<StreakMilestoneDto | null>(null);

  const form = useForm<StreakMilestoneFormData>({
    resolver: zodResolver(streakMilestoneSchema),
    defaultValues: {
      days: "",
      title: "",
      value: "",
      description: "",
    },
  });

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [milestonesData, analyticsData] = await Promise.all([
        getStreakMilestones(waitlistId),
        getStreakAnalytics(waitlistId),
      ]);
      setMilestones(milestonesData);
      setAnalytics(analyticsData);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load streak milestones"));
    } finally {
      setIsLoading(false);
    }
  }, [waitlistId]);

  React.useEffect(() => {
    if (waitlistId) {
      loadData();
    }
  }, [waitlistId, loadData]);

  const openNewDialog = () => {
    setEditingMilestone(null);
    form.reset({
      days: "",
      title: "",
      value: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (milestone: StreakMilestoneDto) => {
    setEditingMilestone(milestone);
    form.reset({
      days: milestone.days.toString(),
      title: milestone.title || "",
      value: milestone.value ? milestone.value.toString() : "",
      description: milestone.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!milestoneToDelete) return;
    try {
      await deleteStreakMilestone(waitlistId, milestoneToDelete.id);
      toast.success("Streak milestone deleted successfully");
      setDeleteDialogOpen(false);
      setMilestoneToDelete(null);
      loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete milestone"));
    }
  };

  const openDeleteDialog = (milestone: StreakMilestoneDto) => {
    setMilestoneToDelete(milestone);
    setDeleteDialogOpen(true);
  };

  const handleSave = async (data: StreakMilestoneFormData) => {
    setIsSubmitting(true);
    try {
      const payload: CreateStreakMilestoneInput = {
        days: parseInt(data.days, 10),
        type: "POSITION_BOOST",
        title: data.title,
        value: parseInt(data.value, 10),
        description: data.description || undefined,
      };

      if (editingMilestone) {
        await updateStreakMilestone(waitlistId, editingMilestone.id, payload);
        toast.success("Milestone updated successfully");
      } else {
        await createStreakMilestone(waitlistId, payload);
        toast.success("Milestone created successfully");
      }
      setIsDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save milestone"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-10 w-72" />
        <Skeleton variant="rectangular" className="h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading streak milestones"
        description={error}
        action={
          <Button onClick={loadData} variant="secondary">Try Again</Button>
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
        Back to waitlist details
      </Link>

      <SectionHeader
        title="Streak Milestones"
        description="Reward participants for consistently sharing their referral link every day."
        action={
          <Button onClick={openNewDialog} leftIcon={<Plus className="h-4 w-4" />}>
            New Milestone
          </Button>
        }
      />

      {analytics && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Active Streakers</p>
              <p className="mt-2 text-3xl font-semibold">{analytics.activeStreakers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Longest Active Streak</p>
              <p className="mt-2 text-3xl font-semibold">{analytics.longestCurrentStreak} days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Total Rewards Unlocked</p>
              <p className="mt-2 text-3xl font-semibold">{analytics.totalRewardsUnlocked}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {milestones.length === 0 ? (
        <EmptyState
          title="No streak milestones configured"
          description="Create your first streak milestone to encourage daily habits."
          action={
            <Button onClick={openNewDialog} leftIcon={<Plus className="h-4 w-4" />}>
              Create Milestone
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Days (Streak)</th>
                  <th className="px-4 py-3 font-medium">Reward</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {milestones.map((milestone) => (
                  <tr key={milestone.id} className="transition-colors hover:bg-surface-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {milestone.days} Days
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="info">+{milestone.value} Places</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{milestone.title}</div>
                      {milestone.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">{milestone.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(milestone)} className="h-8 w-8 p-0 mr-2">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(milestone)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMilestone ? "Edit Streak Milestone" : "Create Streak Milestone"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
                <Input
                  {...form.register("title")}
                  placeholder="e.g. 3 Day Streak Bonus"
                  required
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Consecutive Days <span className="text-destructive">*</span></label>
                  <Input
                    type="number"
                    min="1"
                    {...form.register("days")}
                    placeholder="e.g. 3"
                    required
                  />
                  {form.formState.errors.days && (
                    <p className="text-sm text-destructive">{form.formState.errors.days.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position Boost Bonus <span className="text-destructive">*</span></label>
                  <Input
                    type="number"
                    min="1"
                    {...form.register("value")}
                    placeholder="e.g. 10 (places skipped)"
                    required
                  />
                  {form.formState.errors.value && (
                    <p className="text-sm text-destructive">{form.formState.errors.value.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  {...form.register("description")}
                  placeholder="Details about the reward"
                  rows={3}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Milestone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Milestone</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the milestone "{milestoneToDelete?.title}"? This action cannot be undone.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
