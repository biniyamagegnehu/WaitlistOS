import Link from "next/link";
import { Zap } from "lucide-react";
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
  const iconSize = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const iconInner = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  const content = (
    <>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground",
          iconSize
        )}
      >
        <Zap className={iconInner} aria-hidden="true" />
      </div>
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
