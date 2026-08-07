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
  days: z.coerce.number({ invalid_type_error: "Streak day is required." })
    .int("Streak day must be an integer.")
    .min(2, "Streak day must be at least 2.")
    .max(365, "Streak day cannot exceed 365."),
  title: z.string().min(1, "Title is required"),
  value: z.coerce.number({ invalid_type_error: "Ranking bonus is required." })
    .int("Ranking bonus must be an integer.")
    .min(1, "Ranking bonus must be at least 1.")
    .max(100, "Ranking bonus cannot exceed 100."),
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
      days: 2 as any,
      title: "",
      value: 1 as any,
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
      days: 2 as any,
      title: "",
      value: 1 as any,
      description: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (milestone: StreakMilestoneDto) => {
    setEditingMilestone(milestone);
    form.reset({
      days: milestone.days,
      title: milestone.title || "",
      value: milestone.value,
      description: milestone.description || "",
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
    // Custom validation
    const isDuplicate = milestones.some(m => m.id !== editingMilestone?.id && m.days === data.days);
    if (isDuplicate) {
      form.setError("days", { type: "manual", message: `A milestone for Day ${data.days} already exists.` });
      return;
    }

    const earlier = milestones.filter(m => m.id !== editingMilestone?.id && m.days < data.days);
    const highestEarlier = earlier.sort((a, b) => b.days - a.days)[0];
    if (highestEarlier && data.value < highestEarlier.value) {
      form.setError("value", { type: "manual", message: "Later milestones should provide equal or greater rewards." });
      return;
    }

    const later = milestones.filter(m => m.id !== editingMilestone?.id && m.days > data.days);
    const lowestLater = later.sort((a, b) => a.days - b.days)[0];
    if (lowestLater && data.value > lowestLater.value) {
      form.setError("value", { type: "manual", message: "Earlier milestones should provide equal or less rewards." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateStreakMilestoneInput = {
        days: data.days,
        type: "POSITION_BOOST",
        title: data.title,
        value: data.value,
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
                {[...milestones].sort((a, b) => a.days - b.days).map((milestone) => (
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
                    min="2"
                    max="365"
                    inputMode="numeric"
                    onWheel={(e) => e.currentTarget.blur()}
                    {...form.register("days")}
                    onChange={(e) => {
                      handleNumericInput(e);
                      form.register("days").onChange(e);
                    }}
                    placeholder="e.g. 3"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Must be greater than the previous milestone.</p>
                  {form.formState.errors.days && (
                    <p className="text-sm text-destructive">{form.formState.errors.days.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position Boost Bonus <span className="text-destructive">*</span></label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    inputMode="numeric"
                    onWheel={(e) => e.currentTarget.blur()}
                    {...form.register("value")}
                    onChange={(e) => {
                      handleNumericInput(e);
                      form.register("value").onChange(e);
                    }}
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
