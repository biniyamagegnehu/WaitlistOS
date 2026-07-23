import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";

interface BrandLogoProps {
  href?: string;
  className?: string;
  showText?: boolean;
  size?: "sm" | "md";
}

export function BrandLogo({
  href = "/",
  className,
  showText = true,
  size = "md",
}: BrandLogoProps) {
  const height = size === "sm" ? 32 : 40;
  const width = size === "sm" ? 32 : 40;

  const content = (
    <>
      <Image
        src="/favicon.ico"
        alt="WaitlistOS Logo"
        width={width}
        height={height}
        className="shrink-0 dark:invert dark:hue-rotate-180 dark:mix-blend-lighten"
      />
      {showText && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          WaitlistOS
        </span>
      )}
    </>
  );

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {content}
    </Link>
  );
}
