import { supabase } from "@/app/shared/supabaseClient";

type UpsertPatch = {
  admin_full_name?: string | null;
  admin_phone?: string | null;
  email?: string | null;
  admin_role?: string | null;
  username?: string | null;
};

export async function getMyAdminProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error("Not authenticated") };

  const res = await supabase.from("admin_profiles").select("username,full_name,email,phone,role,user_id").eq("user_id", user.id).single();
  return res;
}

export async function upsertMyAdminProfile(patch: UpsertPatch) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error("Not authenticated") };

  const row: any = { user_id: user.id };
  if (patch.admin_full_name !== undefined) row.full_name = patch.admin_full_name;
  if (patch.admin_phone !== undefined) row.phone = patch.admin_phone;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.admin_role !== undefined) row.role = patch.admin_role;
  if (patch.username !== undefined) row.username = patch.username;

  const res = await supabase.from("admin_profiles").upsert(row, { onConflict: "user_id" }).select().single();
  return res;
}

export async function updateMyPassword(currentPassword: string, newPassword: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return { data: null, error: new Error("Not authenticated") };

  // Re-authenticate
  const signIn = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (signIn.error) return { data: null, error: signIn.error };

  // Update password via auth API
  const updated = await supabase.auth.updateUser({ password: newPassword });
  return updated;
}
