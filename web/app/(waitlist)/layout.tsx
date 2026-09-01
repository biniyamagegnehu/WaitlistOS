import { BrandLogo } from "@/components/brand/logo";
import { PageContainer } from "@/components/patterns/page-container";

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-center border-b border-border px-4">
        <BrandLogo size="sm" />
      </header>

      <main className="flex flex-1 flex-col">
        <PageContainer maxWidth="md" className="py-10 sm:py-16">
          {children}
        </PageContainer>
      </main>
    </div>
  );
}
