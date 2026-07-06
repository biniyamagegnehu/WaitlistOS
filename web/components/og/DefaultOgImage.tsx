import { OG_COLORS } from "@/lib/og";
import { OgWaitlistOsMark } from "@/components/og/OgLogo";

export function DefaultOgImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: OG_COLORS.background,
        padding: 48,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: OG_COLORS.card,
          borderRadius: 24,
          border: `1px solid ${OG_COLORS.border}`,
          padding: 64,
        }}
      >
        <OgWaitlistOsMark size={72} />
        <div style={{ display: "flex", height: 24, width: 1 }} />
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 700,
            color: OG_COLORS.text,
          }}
        >
          WaitlistOS
        </div>
        <div style={{ display: "flex", height: 12, width: 1 }} />
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: OG_COLORS.secondary,
            textAlign: "center",
            maxWidth: 720,
          }}
        >
          Launch with momentum. Build referral-powered waitlists.
        </div>
        <div style={{ display: "flex", height: 24, width: 1 }} />
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: OG_COLORS.primary,
            fontWeight: 600,
          }}
        >
          waitlistos.com
        </div>
      </div>
    </div>
  );
}
