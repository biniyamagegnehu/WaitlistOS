import { CreditCard, LayoutDashboard, List, Settings } from "lucide-react";
import { routes } from "@/lib/routes";

export interface DashboardNavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  match: (pathname: string) => boolean;
}

export const dashboardNavLinks: DashboardNavLink[] = [
  {
    label: "Dashboard",
    href: routes.dashboard,
    icon: <LayoutDashboard className="h-4 w-4" />,
    match: (pathname) => pathname === routes.dashboard,
  },
  {
    label: "Waitlists",
    href: routes.waitlists,
    icon: <List className="h-4 w-4" />,
    match: (pathname) =>
      pathname === routes.waitlists || pathname.startsWith(`${routes.waitlists}/`),
  },
  {
    label: "Billing",
    href: routes.billing,
    icon: <CreditCard className="h-4 w-4" />,
    match: (pathname) =>
      pathname === routes.billing || pathname.startsWith(`${routes.billing}/`),
  },
  {
    label: "Settings",
    href: routes.settings,
    icon: <Settings className="h-4 w-4" />,
    match: (pathname) =>
      pathname === routes.settings ||
      pathname.startsWith(`${routes.settings}/`) ||
      pathname === routes.profile ||
      pathname === routes.security ||
      pathname === routes.sessions,
  },
];

export function isDashboardNavActive(pathname: string, href: string): boolean {
  const link = dashboardNavLinks.find((item) => item.href === href);
  return link ? link.match(pathname) : pathname.startsWith(href);
}

