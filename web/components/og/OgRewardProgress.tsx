import type { RewardProgress } from "@/types/referral-og";
import { OG_COLORS } from "@/lib/og";

interface OgRewardProgressProps {
  progress: RewardProgress;
  referralCount: number;
}

const PROGRESS_BAR_WIDTH = 1040;

export function OgRewardProgress({
  progress,
  referralCount,
}: OgRewardProgressProps) {
  const referralLabel =
    referralCount === 1 ? "1 referral" : `${referralCount} referrals`;
  const fillWidth = Math.round((progress.percent / 100) * PROGRESS_BAR_WIDTH);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <span
          style={{
            fontSize: 22,
            color: OG_COLORS.text,
            fontWeight: 600,
          }}
        >
          {referralLabel}
        </span>
        <span
          style={{
            fontSize: 18,
            color: OG_COLORS.secondary,
          }}
        >
          {progress.current}/{progress.target} reward progress
        </span>
      </div>

      <div
        style={{
          width: "100%",
          height: 12,
          backgroundColor: OG_COLORS.border,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: fillWidth,
            height: "100%",
            backgroundColor: OG_COLORS.accent,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}
