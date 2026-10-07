import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-muted/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.72_0.08_175_/_0.18),_transparent_55%)]" />
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          NeoZap
        </Link>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Scheduling for clinics, salons, and gyms
        </p>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 pt-4">
        {children}
      </main>
    </div>
  );
}
