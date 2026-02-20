import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/app/shared/supabaseClient";
import { getMyAdminProfile, upsertMyAdminProfile, updateMyPassword } from "@/app/modules/internet/admin/services/adminProfiles.service";

export type AdminProfile = {
  username?: string | null;
  admin_full_name?: string | null;
  email?: string | null;
  admin_phone?: string | null;
  admin_role?: string | null;
  user_id?: string | null;
};

export function useAdminProfile() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyAdminProfile();
      if (res.error) {
        setError(res.error.message ?? String(res.error));
        setProfile(null);
      } else if (res.data) {
        setProfile({
          username: res.data.username ?? null,
          admin_full_name: res.data.full_name ?? null,
          email: res.data.email ?? null,
          admin_phone: res.data.phone ?? null,
          admin_role: res.data.role ?? null,
          user_id: res.data.user_id ?? null,
        });
      } else {
        // no row; try to seed from auth user
        const { data: { user } } = await supabase.auth.getUser();
        setProfile({ email: user?.email ?? null, user_id: user?.id ?? null });
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async (patch: { username?: string | null; admin_full_name?: string | null; admin_phone?: string | null; admin_role?: string | null; email?: string | null }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await upsertMyAdminProfile({ username: patch.username ?? null, admin_full_name: patch.admin_full_name ?? null, admin_phone: patch.admin_phone ?? null, admin_role: patch.admin_role ?? null, email: patch.email ?? null });
      if (res.error) throw res.error;
      const d = res.data;
      setProfile({ username: d.username ?? null, admin_full_name: d.full_name ?? null, email: d.email ?? null, admin_phone: d.phone ?? null, admin_role: d.role ?? null, user_id: d.user_id ?? null });
      return { ok: true };
    } catch (e: any) {
      setError(e?.message ?? String(e));
      return { ok: false, error: e?.message ?? String(e) };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateMyPassword(currentPassword, newPassword);
      if (res.error) throw res.error;
      return { ok: true };
    } catch (e: any) {
      setError(e?.message ?? String(e));
      return { ok: false, error: e?.message ?? String(e) };
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, reload: load, saveProfile, changePassword };
}
