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
  const height = size === "sm" ? 28 : 36;

  const content = (
    <>
      <img
        src="/getlist-logo-light.png"
        alt="Getlist Logo"
        style={{ height: `${height}px`, width: "auto", mixBlendMode: "multiply", filter: "contrast(2)" }}
        className="shrink-0 block dark:hidden object-contain"
      />
      <img
        src="/getlist-logo-dark.png"
        alt="Getlist Logo"
        style={{ height: `${height}px`, width: "auto", mixBlendMode: "screen", filter: "contrast(2)" }}
        className="shrink-0 hidden dark:block object-contain"
      />
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
