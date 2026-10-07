import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <p className="text-sm font-semibold tracking-tight">NeoZap</p>
        <div className="flex items-center gap-2">
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
            Sign in
          </Link>
          <Link href="/register" className={cn(buttonVariants())}>
            Get started
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pb-24">
        <p className="mb-3 text-sm font-medium text-primary">Phase 1</p>
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-foreground">
          Modern operations for clinics, salons, and gyms.
        </h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
          NeoZap gives service businesses a single workspace for clients, offerings, and
          appointments — with tenant isolation from day one.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
            Create your workspace
          </Link>
          <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
