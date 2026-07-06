import { OG_COLORS } from "@/lib/og";

interface OgLogoProps {
  logoUrl?: string | null;
  productName: string;
  size?: number;
}

export function OgWaitlistOsMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill={OG_COLORS.primary} />
      <path d="M34 14L22 34H30L28 50L42 28H34V14Z" fill={OG_COLORS.background} />
    </svg>
  );
}

export function OgLogo({ logoUrl, productName, size = 56 }: OgLogoProps) {
  const embeddedLogo = logoUrl?.startsWith("data:image/") ? logoUrl : null;

  if (embeddedLogo) {
    return (
      <img
        src={embeddedLogo}
        alt={`${productName} logo`}
        width={size}
        height={size}
        style={{
          borderRadius: 12,
          border: `1px solid ${OG_COLORS.border}`,
        }}
      />
    );
  }

  return <OgWaitlistOsMark size={size} />;
}
