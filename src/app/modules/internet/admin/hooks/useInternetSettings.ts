import { useEffect, useState } from "react";

export type InternetSettings = {
  providerName?: string;
  accountNumber?: string;
  dueDay?: number; // day of month 1-31
  amount?: number;
  plan?: string;
  mbps?: number;
};

export function useInternetSettings() {
  const defaultSettings: InternetSettings = { providerName: "", accountNumber: "", dueDay: 1, amount: 0, plan: "", mbps: 0 };

  const [settings, setSettings] = useState<InternetSettings>(defaultSettings);

  const [draft, setDraft] = useState<InternetSettings>(settings);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // When saved settings change (from other instances), update local state
  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  // Remote fetch: attempt to load from Supabase table `internet_settings` (id = 'default')
  const fetchRemote = async () => {
    try {
      const mod = await import("@/app/shared/supabaseClient");
      const { supabase } = mod;
      const { data, error } = await supabase.from("internet_settings").select("*").eq("id", "default").maybeSingle();
      if (error) {
        const msg = error?.message ?? JSON.stringify(error);
        return { ok: false, error: String(msg) } as const;
      }
      if (!data) return { ok: false, error: "no row" } as const;
      const parsed: InternetSettings = {
        providerName: data.provider_name ?? "",
        accountNumber: data.account_number ?? "",
        dueDay: Number(data.due_day ?? 1),
        amount: Number(data.amount ?? 0),
        plan: data.plan ?? "",
        mbps: Number(data.mbps ?? 0),
      };
      setSettings(parsed);
      setDraft(parsed);
      return { ok: true, data: parsed } as const;
    } catch (err: any) {
      const msg = err?.message ?? JSON.stringify(err);
      return { ok: false, error: String(msg) } as const;
    }
  };

  // Auto-load remote settings on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await fetchRemote();
      if (!mounted) return;
      setLoading(false);
      if (!res.ok) setError(res.error ?? "Failed to load remote settings");
      else setError(null);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Remote save: upsert into Supabase table `internet_settings` using id = 'default'
  const save = async () => {
    try {
      const mod = await import("@/app/shared/supabaseClient");
      const { supabase } = mod;
      const toSave = {
        id: "default",
        provider_name: draft.providerName ?? "",
        account_number: draft.accountNumber ?? "",
        due_day: draft.dueDay ?? 1,
        amount: draft.amount ?? 0,
        plan: draft.plan ?? "",
        mbps: draft.mbps ?? 0,
      };
      const { data, error } = await supabase.from("internet_settings").upsert(toSave, { returning: "representation" });
      if (error) {
        const msg = error?.message ?? JSON.stringify(error);
        return { ok: false, error: String(msg) } as const;
      }
      // reflect saved values from remote
      const parsed: InternetSettings = {
        providerName: toSave.provider_name,
        accountNumber: toSave.account_number,
        dueDay: Number(toSave.due_day),
        amount: Number(toSave.amount),
        plan: toSave.plan,
        mbps: Number(toSave.mbps),
      };
      setSettings(parsed);
      setDraft(parsed);
      return { ok: true, data: parsed } as const;
    } catch (err: any) {
      const msg = err?.message ?? JSON.stringify(err);
      return { ok: false, error: String(msg) } as const;
    }
  };

  const resetDraft = () => setDraft(settings);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(settings);

  return { settings, draft, setDraft, save, resetDraft, isDirty, fetchRemote, loading, error } as const;
}

export default useInternetSettings;
