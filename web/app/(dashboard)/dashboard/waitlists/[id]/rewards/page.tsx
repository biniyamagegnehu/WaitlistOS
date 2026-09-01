"use client";

import * as React from "react";
import { BackButton } from "@/components/navigation/back-button";
import { useParams, useRouter } from "next/navigation";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { LoadingState } from "@/components/patterns/loading-state";
import { ErrorState } from "@/components/patterns/error-state";
import { MetricCard } from "@/components/patterns/metric-card";
import { DataTable } from "@/components/patterns/data-table";
import { Button } from "@/components/ui/button";
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
  valueType: z.enum(["fixed", "percent"]).optional(),
  description: z.string().optional(),
}).refine((data) => {
  if (data.type === "POSITION_BOOST" || data.type === "DISCOUNT") {
    return !!data.value;
  }
  return true;
}, {
  message: "Value is required for Position Boost and Discount rewards",
  path: ["value"],
}).refine((data) => {
  if (data.type === "DISCOUNT" && data.value) {
    const numValue = parseFloat(data.value);
    return !isNaN(numValue) && numValue >= 0 && numValue <= 100;
  }
  return true;
}, {
  message: "Discount must be a percentage between 0 and 100",
  path: ["value"],
}).refine((data) => {
  if (data.type === "CUSTOM" && data.valueType === "percent" && data.value) {
    const numValue = parseFloat(data.value);
    return !isNaN(numValue) && numValue >= 0 && numValue <= 100;
  }
  return true;
}, {
  message: "Percentage value must be between 0 and 100",
  path: ["value"],
});

type RewardFormData = z.infer<typeof rewardSchema>;

export default function RewardsPage() {
  const params = useParams();
  const router = useRouter();
  const waitlistId = params?.id as string;

  const [rewards, setRewards] = React.useState<Reward[]>([]);
  const [analytics, setAnalytics] = React.useState<RewardAnalytics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editingReward, setEditingReward] = React.useState<Reward | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [rewardToDelete, setRewardToDelete] = React.useState<Reward | null>(null);

  const form = useForm<RewardFormData>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      milestone: "",
      type: "POSITION_BOOST",
      title: "",
      value: "",
      valueType: "fixed",
      description: "",
    },
  });

  const { watch } = form;
  const rewardType = watch("type");
  const valueType = watch("valueType");

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
      valueType: "fixed",
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
      valueType: reward.valueType || "fixed",
      description: reward.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!rewardToDelete) return;
    try {
      await deleteReward(waitlistId, rewardToDelete.id);
      toast.success("Reward deleted successfully");
      setDeleteDialogOpen(false);
      setRewardToDelete(null);
      loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete reward"));
    }
  };

  const openDeleteDialog = (reward: Reward) => {
    setRewardToDelete(reward);
    setDeleteDialogOpen(true);
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
        valueType: data.type === "CUSTOM" ? data.valueType : undefined,
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
      <PageContainer>
        <LoadingState variant="skeleton" skeletonCount={4} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          title="Error loading rewards"
          description={error}
          onRetry={loadData}
          onHome={() => router.push(routes.waitlist(waitlistId))}
        />
      </PageContainer>
    );
  }

  const columns = [
    {
      key: "milestone",
      header: "Milestone",
      render: (reward: Reward) => <div className="font-medium">{reward.milestone} Referrals</div>,
    },
    {
      key: "type",
      header: "Type",
      render: (reward: Reward) => <Badge variant="info">{reward.type.replace('_', ' ')}</Badge>,
    },
    {
      key: "title",
      header: "Title",
      render: (reward: Reward) => (
        <div>
          <div className="font-medium text-foreground">{reward.title}</div>
          {reward.description && (
            <div className="text-xs text-muted-foreground truncate max-w-xs">{reward.description}</div>
          )}
        </div>
      ),
    },
    {
      key: "unlocks",
      header: "Unlocks",
      className: "text-muted-foreground",
      render: (reward: Reward) => reward._count?.participantRewards || 0,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (reward: Reward) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => openEditDialog(reward)} className="h-8 w-8 p-0 mr-2">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(reward)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    }
  ];

  return (
    <PageContainer>
      <BackButton href={routes.waitlist(waitlistId)} label="Back to waitlist" className="mb-4" />
      <PageHeader
        title="Referral Rewards"
        description="Encourage participants to share by rewarding them at certain milestones."
        breadcrumbs={[
          { label: "Waitlist", href: routes.waitlist(waitlistId) },
          { label: "Referral Rewards" },
        ]}
        primaryAction={
          <Button onClick={openNewDialog} leftIcon={<Plus className="h-4 w-4" />}>
            New Reward
          </Button>
        }
      />

      {analytics && (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total Rewards"
            value={analytics.totalCreated}
          />
          <MetricCard
            label="Total Unlocked"
            value={analytics.totalUnlocked}
          />
          <MetricCard
            label="Most Unlocked"
            value={analytics.mostUnlocked ? analytics.mostUnlocked.title : "None yet"}
          />
        </div>
      )}

      <DataTable
        data={rewards}
        columns={columns}
        rowKey={(row) => row.id}
        empty={{
          title: "No rewards configured",
          description: "Create your first reward milestone to encourage referrals.",
          action: (
            <Button onClick={openNewDialog} leftIcon={<Plus className="h-4 w-4" />}>
              Create Reward
            </Button>
          ),
        }}
      />

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReward ? "Edit Reward" : "Create Reward"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <DialogBody className="space-y-4">
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

              {(rewardType === 'POSITION_BOOST' || rewardType === 'DISCOUNT' || rewardType === 'CUSTOM') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Value {(rewardType === 'POSITION_BOOST' || rewardType === 'DISCOUNT') && <span className="text-destructive">*</span>}
                  </label>
                  <div className="flex gap-2">
                    {rewardType === 'CUSTOM' && (
                      <select
                        {...form.register("valueType")}
                        className="flex h-10 w-32 rounded-xl border border-border/60 bg-surface px-3 py-2 text-sm ring-offset-background shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="fixed">Fixed</option>
                        <option value="percent">Percent</option>
                      </select>
                    )}
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        {...form.register("value")}
                        placeholder={
                          rewardType === 'POSITION_BOOST' ? 'e.g. 100 (number of positions to skip)' :
                          rewardType === 'DISCOUNT' ? 'e.g. 50' :
                          valueType === 'percent' ? 'e.g. 50' :
                          'e.g. custom value'
                      }
                        required={rewardType === 'POSITION_BOOST' || rewardType === 'DISCOUNT'}
                        className={(rewardType === 'DISCOUNT' || (rewardType === 'CUSTOM' && valueType === 'percent')) ? 'pr-8' : ''}
                      />
                      {(rewardType === 'DISCOUNT' || (rewardType === 'CUSTOM' && valueType === 'percent')) && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                      )}
                    </div>
                  </div>
                  {form.formState.errors.value && (
                    <p className="text-sm text-destructive">{form.formState.errors.value.message}</p>
                  )}
                  {(rewardType === 'DISCOUNT' || (rewardType === 'CUSTOM' && valueType === 'percent')) && !form.formState.errors.value && (
                    <p className="text-xs text-muted-foreground">Enter a percentage between 0 and 100</p>
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

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reward</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the reward "{rewardToDelete?.title}"? This action cannot be undone.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Reward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
