export type RewardType = 'POSITION_BOOST' | 'EARLY_ACCESS' | 'VIP_ACCESS' | 'DISCOUNT' | 'CUSTOM';

export interface Reward {
  id: string;
  waitlistId: string;
  milestone: number;
  type: RewardType;
  value: number | null;
  valueType?: 'fixed' | 'percent';
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    participantRewards: number;
  };
}

export interface CreateRewardDto {
  milestone: number;
  type: RewardType;
  value?: number | null;
  valueType?: 'fixed' | 'percent';
  title: string;
  description?: string;
}

export interface UpdateRewardDto extends Partial<CreateRewardDto> {}

export interface RewardAnalytics {
  totalCreated: number;
  totalUnlocked: number;
  mostUnlocked: {
    id: string;
    title: string;
    unlocks: number;
  } | null;
}
