import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { DashboardWaitlist } from "@/types/dashboard";
import { routes } from "@/lib/routes";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface WaitlistCardProps {
  waitlist: DashboardWaitlist;
}

export function WaitlistCard({ waitlist }: WaitlistCardProps) {
  return (
    <Link
      href={routes.waitlist(waitlist.id)}
      id={`waitlist-card-${waitlist.id}`}
      className="group block"
    >
      <Card hover className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
              {waitlist.name}
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">/{waitlist.slug}</p>
          </div>

          <Badge variant="success">
            {waitlist.totalParticipants}{" "}
            {waitlist.totalParticipants === 1 ? "member" : "members"}
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
          <span>View participants</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Card>
    </Link>
  );
}
