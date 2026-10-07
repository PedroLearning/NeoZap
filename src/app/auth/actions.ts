"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
  message: string | null;
};

export const initialAuthState: AuthActionState = {
  error: null,
  message: null,
};

function asString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getSiteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) {
    return origin;
  }

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

export async function login(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = asString(formData, "email").toLowerCase();
  const password = asString(formData, "password");
  const nextPath = asString(formData, "next") || "/dashboard";

  if (!isValidEmail(email) || password.length === 0) {
    return {
      error: "Enter a valid email and password.",
      message: null,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message,
      message: null,
    };
  }

  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
  redirect(safeNext);
}

export async function register(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const fullName = asString(formData, "full_name");
  const businessName = asString(formData, "business_name");
  const email = asString(formData, "email").toLowerCase();
  const password = asString(formData, "password");

  if (fullName.length < 2) {
    return { error: "Enter your full name.", message: null };
  }

  if (businessName.length < 2) {
    return { error: "Enter your business name.", message: null };
  }

  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address.", message: null };
  }

  if (password.length < 8) {
    return {
      error: "Password must be at least 8 characters.",
      message: null,
    };
  }

  const origin = await getSiteOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        business_name: businessName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message, message: null };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    error: null,
    message: "Account created. Check your email to confirm your address, then sign in.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
