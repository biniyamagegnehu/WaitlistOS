import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * PageContainer — Canonical page-level layout wrapper.
 *
 * This is the SINGLE SOURCE OF TRUTH for standard page horizontal gutters.
 * It consumes the --page-gutter-x design token, which resolves to:
 *
 *   Mobile  (< 640px):  16px  →  px-4
 *   Tablet  (≥ 640px):  24px  →  sm:px-6
 *   Desktop (≥ 1024px): 32px  →  lg:px-8
 *
 * ARCHITECTURAL RULE — Standard pages must follow this composition:
 *
 *   <PageContainer>
 *     <PageHeader ... />
 *     {content}
 *   </PageContainer>
 *
 * Do NOT add additional px-* classes on top of PageContainer.
 * Do NOT create custom page-level horizontal padding outside of this component.
 *
 * Exceptions (intentional full-bleed surfaces):
 *   - Page Builder  (canvas editor — full-width split-pane)
 *   - Marketing hero sections (full-bleed by design)
 *
 * @see globals.css  --page-gutter-x
 */

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Controls the max-width of the content region.
   * @default "lg" (max-w-7xl)
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /**
   * Disables the default vertical padding (py-6 sm:py-8) so that
   * custom vertical padding can be provided by the wrapper (e.g. Marketing sections).
   */
  withoutVerticalPadding?: boolean;
  children: React.ReactNode;
}

const maxWidthClasses: Record<NonNullable<PageContainerProps["maxWidth"]>, string> = {
  sm:   "max-w-3xl",
  md:   "max-w-5xl",
  lg:   "max-w-7xl",
  xl:   "max-w-[88rem]",
  "2xl":"max-w-screen-2xl",
  full: "max-w-full",
};

export function PageContainer({
  maxWidth = "lg",
  withoutVerticalPadding = false,
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      /**
       * px-4 sm:px-6 lg:px-8 maps 1:1 to --page-gutter-x breakpoint values.
       * py-6 sm:py-8 provides consistent vertical breathing room.
       */
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        !withoutVerticalPadding && "py-6 sm:py-8",
        maxWidthClasses[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
