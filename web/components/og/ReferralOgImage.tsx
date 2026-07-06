import type { ReferralOgData } from "@/types/referral-og";
import { OG_COLORS, getParticipantDisplayName } from "@/lib/og";
import { OgWaitlistOsMark } from "@/components/og/OgLogo";

interface ReferralOgImageProps {
  data: ReferralOgData;
}

const PROGRESS_BAR_WIDTH = 900;

export function ReferralOgImage({ data }: ReferralOgImageProps) {
  const participantName = getParticipantDisplayName(data.participant.displayName);
  const { waitlist, participant } = data;
  const referralLabel =
    participant.referralCount === 1
      ? "1 referral"
      : `${participant.referralCount} referrals`;
  const fillWidth = Math.max(
    0,
    Math.min(
      PROGRESS_BAR_WIDTH,
      Math.round((participant.rewardProgress.percent / 100) * PROGRESS_BAR_WIDTH)
    )
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: OG_COLORS.background,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 1120,
          height: 550,
          backgroundColor: OG_COLORS.card,
          borderRadius: 24,
          border: `2px solid ${OG_COLORS.border}`,
          paddingTop: 40,
          paddingBottom: 40,
          paddingLeft: 48,
          paddingRight: 48,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <OgWaitlistOsMark size={56} />
          <div style={{ display: "flex", height: 20, width: 1 }} />
          <div
            style={{
              display: "flex",
              fontSize: 36,
              fontWeight: 700,
              color: OG_COLORS.text,
            }}
          >
            {waitlist.name}
          </div>
          <div style={{ display: "flex", height: 12, width: 1 }} />
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: OG_COLORS.secondary,
              textAlign: "center",
              maxWidth: 900,
            }}
          >
            {waitlist.tagline}
          </div>
        </div>

        <div style={{ display: "flex", height: 32, width: 1 }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 600,
              color: OG_COLORS.text,
            }}
          >
            {participantName}
          </div>
          <div style={{ display: "flex", height: 8, width: 1 }} />
          <div
            style={{
              display: "flex",
              fontSize: 80,
              fontWeight: 700,
              color: OG_COLORS.primary,
              lineHeight: 1,
            }}
          >
            #{participant.position}
          </div>
          <div style={{ display: "flex", height: 8, width: 1 }} />
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: OG_COLORS.secondary,
            }}
          >
            on the waitlist
          </div>
        </div>

        <div style={{ display: "flex", height: 32, width: 1 }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              color: OG_COLORS.primary,
              justifyContent: "center",
            }}
          >
            Invite friends to move up.
          </div>
          <div style={{ display: "flex", height: 16, width: 1 }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 20,
                fontWeight: 600,
                color: OG_COLORS.text,
              }}
            >
              {referralLabel}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: OG_COLORS.secondary,
              }}
            >
              {participant.rewardProgress.current}/{participant.rewardProgress.target}{" "}
              reward progress
            </div>
          </div>
          <div style={{ display: "flex", height: 10, width: 1 }} />

          <div
            style={{
              display: "flex",
              width: PROGRESS_BAR_WIDTH,
              height: 12,
              backgroundColor: OG_COLORS.border,
              borderRadius: 999,
            }}
          >
            <div
              style={{
                display: "flex",
                width: fillWidth,
                height: 12,
                backgroundColor: OG_COLORS.accent,
                borderRadius: 999,
              }}
            />
          </div>
          <div style={{ display: "flex", height: 16, width: 1 }} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <OgWaitlistOsMark size={20} />
            <div style={{ display: "flex", width: 8 }} />
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: OG_COLORS.secondary,
                fontWeight: 600,
              }}
            >
              waitlistos.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
