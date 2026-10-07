import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign in · NeoZap",
  description: "Sign in to your NeoZap workspace.",
};

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <AuthShell>
      <Suspense fallback={<LoginForm />}>
        <LoginWithNext searchParams={props.searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function LoginWithNext({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const params = await searchParams;
  const nextValue = params.next;
  const nextPath =
    typeof nextValue === "string" && nextValue.startsWith("/") && !nextValue.startsWith("//")
      ? nextValue
      : "/dashboard";

  return <LoginForm nextPath={nextPath} />;
}
