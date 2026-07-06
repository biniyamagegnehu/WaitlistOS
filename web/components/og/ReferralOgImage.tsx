import type { ReferralOgData } from "@/types/referral-og";
import { OG_COLORS, getParticipantDisplayName } from "@/lib/og";
import { OgLogo, OgWaitlistOsMark } from "@/components/og/OgLogo";
import { OgRewardProgress } from "@/components/og/OgRewardProgress";

interface ReferralOgImageProps {
  data: ReferralOgData;
}

export function ReferralOgImage({ data }: ReferralOgImageProps) {
  const participantName = getParticipantDisplayName(data.participant.displayName);
  const { waitlist, branding, participant } = data;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: OG_COLORS.background,
        padding: 40,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: OG_COLORS.card,
          borderRadius: 24,
          border: `1px solid ${OG_COLORS.border}`,
          paddingTop: 48,
          paddingBottom: 48,
          paddingLeft: 56,
          paddingRight: 56,
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <OgLogo
            logoUrl={branding?.logoUrl}
            productName={waitlist.name}
            size={64}
          />
          <span
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: OG_COLORS.text,
              letterSpacing: -0.5,
            }}
          >
            {waitlist.name}
          </span>
          <span
            style={{
              fontSize: 24,
              color: OG_COLORS.secondary,
              textAlign: "center",
              maxWidth: 900,
              lineHeight: 1.35,
            }}
          >
            {waitlist.tagline}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 30,
              fontWeight: 600,
              color: OG_COLORS.text,
            }}
          >
            {participantName}
          </span>
          <span
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: OG_COLORS.primary,
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            #{participant.position}
          </span>
          <span
            style={{
              fontSize: 26,
              color: OG_COLORS.secondary,
            }}
          >
            on the waitlist
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: OG_COLORS.primary,
              textAlign: "center",
            }}
          >
            Invite friends to move up.
          </span>

          <OgRewardProgress
            progress={participant.rewardProgress}
            referralCount={participant.referralCount}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginTop: 4,
            }}
          >
            <OgWaitlistOsMark size={24} />
            <span
              style={{
                fontSize: 20,
                color: OG_COLORS.secondary,
                fontWeight: 600,
              }}
            >
              waitlistos.com
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
