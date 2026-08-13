"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getDashboardWaitlists } from "@/services/dashboard";

export function AnalyticsWaitlistFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [waitlists, setWaitlists] = React.useState<Array<{ id: string; name: string }>>([]);

  React.useEffect(() => {
    getDashboardWaitlists().then((items) => setWaitlists(items.map(({ id, name }) => ({ id, name })))).catch(() => setWaitlists([]));
  }, []);

  const selected = searchParams.get("waitlistId") ?? "";
  const updateSelection = (waitlistId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (waitlistId) params.set("waitlistId", waitlistId); else params.delete("waitlistId");
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-foreground sm:flex-row sm:items-center">
      <span>Waitlist</span>
      <select aria-label="Select analytics waitlist" value={selected} onChange={(event) => updateSelection(event.target.value)} className="min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal">
        <option value="">All Waitlists</option>
        {waitlists.map((waitlist) => <option key={waitlist.id} value={waitlist.id}>{waitlist.name}</option>)}
      </select>
    </label>
  );
}
