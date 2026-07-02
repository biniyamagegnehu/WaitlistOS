import Link from "next/link";
import { Zap } from "lucide-react";

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d14] text-white">
      {/* Minimal header — logo only */}
      <header className="flex h-14 items-center justify-center border-b border-white/8 px-4">
        <Link
          href="/"
          aria-label="WaitlistOS home"
          className="flex items-center gap-2 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm tracking-tight">WaitlistOS</span>
        </Link>
      </header>

      {/* Centered single-column content */}
      <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
