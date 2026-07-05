import { Spinner } from "@/components/ui/loader";
import { cn } from "@/lib/cn";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({
  message = "Loading…",
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center bg-background text-muted-foreground",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner className="h-6 w-6 text-primary" />
      <p className="mt-4 text-sm">{message}</p>
    </div>
  );
}
