import { Suspense } from "react";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard · NeoZap",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardHome />
    </Suspense>
  );
}

function DashboardFallback() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-muted/40 px-4">
      <p className="text-sm text-muted-foreground">Loading your workspace…</p>
    </div>
  );
}

async function DashboardHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, business_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/40">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div>
          <p className="text-sm font-semibold tracking-tight">NeoZap</p>
          <p className="text-sm text-muted-foreground">
            {profile?.business_name ?? "Your workspace"}
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</CardTitle>
            <CardDescription>
              Phase 1 is live. Client, service, and appointment modules come next.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You are signed in as {user?.email ?? "an authenticated owner"}. Row Level Security
            isolates every tenant to their own business data.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
