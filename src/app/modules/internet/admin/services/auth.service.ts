import { supabase } from "@/app/shared/supabaseClient";

export async function signIn(identifier: string, password: string) {
  const trimmed = identifier.trim();

  // If user typed an email
  if (trimmed.includes("@")) {
    return supabase.auth.signInWithPassword({ email: trimmed, password });
  }

  // Otherwise treat as username and resolve to email
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("email")
    .eq("username", trimmed)
    .single();

  if (error || !data?.email) {
    return { data: null, error: new Error("Username not found") } as const;
  }
  
  return supabase.auth.signInWithPassword({ email: data.email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export async function recoverPassword(identifier: string, redirectTo?: string) {
  const trimmed = identifier.trim();

  const defaultRedirect = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
  const redirect = redirectTo ?? defaultRedirect;

  if (trimmed.includes("@")) {
    return supabase.auth.resetPasswordForEmail(trimmed, redirect ? { redirectTo: redirect } : undefined);
  }

  const { data, error } = await supabase
    .from("admin_profiles")
    .select("email")
    .eq("username", trimmed)
    .single();

  if (error || !data?.email) {
    return { data: null, error: new Error("Username not found") } as const;
  }

  return supabase.auth.resetPasswordForEmail(data.email, redirect ? { redirectTo: redirect } : undefined);
}