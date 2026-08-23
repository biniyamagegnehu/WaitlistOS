import { BarChart3, CreditCard, LayoutDashboard, List, Settings, DollarSign, Network } from "lucide-react";
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
    label: "Analytics",
    href: routes.analytics,
    icon: <BarChart3 className="h-4 w-4" />,
    match: (pathname) => pathname === "/dashboard/analytics" || pathname.startsWith("/dashboard/analytics/"),
  },
  {
    label: "Monetization",
    href: "/dashboard/monetization",
    icon: <DollarSign className="h-4 w-4" />,
    match: (pathname) => pathname === "/dashboard/monetization" || pathname.startsWith("/dashboard/monetization/"),
  },
  {
    label: "Affiliates",
    href: routes.affiliates,
    icon: <Network className="h-4 w-4" />,
    match: (pathname) => pathname === routes.affiliates || pathname.startsWith(`${routes.affiliates}/`),
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

