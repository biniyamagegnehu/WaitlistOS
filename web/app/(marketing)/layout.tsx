import { MarketingNavbar } from "@/components/navigation/navbar";
import { MarketingFooter } from "@/components/layouts/marketing-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d14] text-white">
      <MarketingNavbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <MarketingFooter />
    </div>
  );
}
