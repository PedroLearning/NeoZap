"use client";

import Link from "next/link";
import { useActionState } from "react";

import { initialAuthState, register } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialAuthState);

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Create your workspace</CardTitle>
        <CardDescription>
          Register your business to start booking clients in minutes.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="full_name">Your name</FieldLabel>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                placeholder="Ana Costa"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="business_name">Business name</FieldLabel>
              <Input
                id="business_name"
                name="business_name"
                type="text"
                autoComplete="organization"
                required
                minLength={2}
                placeholder="Lumen Studio"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="owner@lumen.studio"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="At least 8 characters"
              />
            </Field>
            {state.error ? <FieldError>{state.error}</FieldError> : null}
            {state.message ? (
              <p className="text-sm text-muted-foreground" role="status">
                {state.message}
              </p>
            ) : null}
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3">
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
