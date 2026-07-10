import * as React from "react";
import Link from "next/link";
import { ChevronRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { DashboardWaitlist } from "@/types/dashboard";
import { routes } from "@/lib/routes";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WaitlistCardProps {
  waitlist: DashboardWaitlist;
  onDelete: (waitlist: DashboardWaitlist) => void;
}

export function WaitlistCard({ waitlist, onDelete }: WaitlistCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    onDelete(waitlist);
  };

  return (
    <Link
      href={routes.waitlist(waitlist.id)}
      id={`waitlist-card-${waitlist.id}`}
      className="group block"
    >
      <Card hover className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
              {waitlist.name}
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">/{waitlist.slug}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success">
              {waitlist.totalParticipants}{" "}
              {waitlist.totalParticipants === 1 ? "member" : "members"}
            </Badge>

            <div ref={menuRef} className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>

              {showMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-md border border-border bg-surface shadow-md">
                  <Link
                    href={routes.waitlistEdit(waitlist.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
          <span>View participants</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Card>
    </Link>
  );
}
