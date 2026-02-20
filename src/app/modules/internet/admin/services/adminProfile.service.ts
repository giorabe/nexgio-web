import { supabase } from "@/app/shared/supabaseClient";

export type AdminProfileRow = {
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  updated_at?: string | null;
};

export async function fetchAdminProfile() {
  try {
    const u = await supabase.auth.getUser();
    const user = (u as any)?.data?.user;
    if (!user || !user.id) return { data: null, error: null };

    const { data, error } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return { data: data as AdminProfileRow | null, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateAdminProfile(patch: Partial<AdminProfileRow>) {
  try {
    const u = await supabase.auth.getUser();
    const user = (u as any)?.data?.user;
    if (!user || !user.id) return { data: null, error: new Error("No authenticated user") };

    const payload: Record<string, unknown> = { user_id: user.id, ...patch };

    const { data, error } = await supabase
      .from("admin_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();

    return { data: data as AdminProfileRow | null, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function changePassword(newPassword: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
