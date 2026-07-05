import { BrandLogo } from "@/components/brand/logo";

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

      <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
