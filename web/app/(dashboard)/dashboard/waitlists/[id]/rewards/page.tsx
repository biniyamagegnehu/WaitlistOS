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
import { getWaitlistRewards, getWaitlistRewardAnalytics, createReward, updateReward, deleteReward } from "@/services/rewards";
import type { Reward, RewardAnalytics, CreateRewardDto, RewardType } from "@/types/reward";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

const rewardSchema = z.object({
  milestone: z.string().min(1, "Milestone is required"),
  type: z.enum(["POSITION_BOOST", "EARLY_ACCESS", "VIP_ACCESS", "DISCOUNT", "CUSTOM"]),
  title: z.string().min(1, "Title is required"),
  value: z.string().optional(),
  description: z.string().optional(),
}).refine((data) => {
  if (data.type === "POSITION_BOOST" || data.type === "DISCOUNT") {
    return !!data.value;
  }
  return true;
}, {
  message: "Value is required for Position Boost and Discount rewards",
  path: ["value"],
});

type RewardFormData = z.infer<typeof rewardSchema>;

export default function RewardsPage() {
  const params = useParams();
  const waitlistId = params?.id as string;

  const [rewards, setRewards] = React.useState<Reward[]>([]);
  const [analytics, setAnalytics] = React.useState<RewardAnalytics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editingReward, setEditingReward] = React.useState<Reward | null>(null);

  const form = useForm<RewardFormData>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      milestone: "",
      type: "POSITION_BOOST",
      title: "",
      value: "",
      description: "",
    },
  });

  const { watch } = form;
  const rewardType = watch("type");

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [rewardsData, analyticsData] = await Promise.all([
        getWaitlistRewards(waitlistId),
        getWaitlistRewardAnalytics(waitlistId),
      ]);
      setRewards(rewardsData);
      setAnalytics(analyticsData);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load rewards"));
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
    setEditingReward(null);
    form.reset({
      milestone: "",
      type: "POSITION_BOOST",
      title: "",
      value: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (reward: Reward) => {
    setEditingReward(reward);
    form.reset({
      milestone: reward.milestone.toString(),
      type: reward.type,
      title: reward.title,
      value: reward.value ? reward.value.toString() : "",
      description: reward.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reward?")) return;
    try {
      await deleteReward(waitlistId, id);
      toast.success("Reward deleted successfully");
      loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete reward"));
    }
  };

  const handleSave = async (data: RewardFormData) => {
    setIsSubmitting(true);
    try {
      const payload: CreateRewardDto = {
        milestone: parseInt(data.milestone, 10),
        type: data.type,
        title: data.title,
        value: data.value ? parseInt(data.value, 10) : undefined,
        description: data.description || undefined,
      };

      if (editingReward) {
        await updateReward(waitlistId, editingReward.id, payload);
        toast.success("Reward updated successfully");
      } else {
        await createReward(waitlistId, payload);
        toast.success("Reward created successfully");
      }
      setIsDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save reward"));
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
        title="Error loading rewards"
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
        title="Referral Rewards"
        description="Encourage participants to share by rewarding them at certain milestones."
        action={
          <Button onClick={openNewDialog} leftIcon={<Plus className="h-4 w-4" />}>
            New Reward
          </Button>
        }
      />

      {analytics && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Total Rewards</p>
              <p className="mt-2 text-3xl font-semibold">{analytics.totalCreated}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Total Unlocked</p>
              <p className="mt-2 text-3xl font-semibold">{analytics.totalUnlocked}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">Most Unlocked</p>
              <p className="mt-2 text-lg font-semibold truncate">
                {analytics.mostUnlocked ? analytics.mostUnlocked.title : "None yet"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {rewards.length === 0 ? (
        <EmptyState
          title="No rewards configured"
          description="Create your first reward milestone to encourage referrals."
          action={
            <Button onClick={openNewDialog} leftIcon={<Plus className="h-4 w-4" />}>
              Create Reward
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Milestone</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Unlocks</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rewards.map((reward) => (
                  <tr key={reward.id} className="transition-colors hover:bg-surface-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {reward.milestone} Referrals
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="info">{reward.type.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{reward.title}</div>
                      {reward.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">{reward.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {reward._count?.participantRewards || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(reward)} className="h-8 w-8 p-0 mr-2">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(reward.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
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
            <DialogTitle>{editingReward ? "Edit Reward" : "Create Reward"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Milestone <span className="text-destructive">*</span></label>
                  <Input
                    type="number"
                    min="1"
                    {...form.register("milestone")}
                    placeholder="e.g. 5"
                    required
                  />
                  {form.formState.errors.milestone && (
                    <p className="text-sm text-destructive">{form.formState.errors.milestone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reward Type <span className="text-destructive">*</span></label>
                  <select
                    {...form.register("type")}
                    className="flex h-10 w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm ring-offset-background shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 hover:border-border"
                  >
                    <option value="POSITION_BOOST">Position Boost</option>
                    <option value="EARLY_ACCESS">Early Access</option>
                    <option value="VIP_ACCESS">VIP Access</option>
                    <option value="DISCOUNT">Discount</option>
                    <option value="CUSTOM">Custom Reward</option>
                  </select>
                  {form.formState.errors.type && (
                    <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
                <Input
                  {...form.register("title")}
                  placeholder="e.g. Skip 100 spots"
                  required
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              {(rewardType === 'POSITION_BOOST' || rewardType === 'DISCOUNT' || rewardType === 'CUSTOM') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Value {(rewardType === 'POSITION_BOOST' || rewardType === 'DISCOUNT') && <span className="text-destructive">*</span>}
                  </label>
                  <Input
                    type="number"
                    {...form.register("value")}
                    placeholder={
                      rewardType === 'POSITION_BOOST' ? 'e.g. 100 (number of positions to skip)' :
                      rewardType === 'DISCOUNT' ? 'e.g. 50 (percentage discount)' :
                      'e.g. custom value'
                  }
                  required={rewardType === 'POSITION_BOOST' || rewardType === 'DISCOUNT'}
                  />
                  {form.formState.errors.value && (
                    <p className="text-sm text-destructive">{form.formState.errors.value.message}</p>
                  )}
                </div>
              )}

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
                {isSubmitting ? "Saving..." : "Save Reward"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
