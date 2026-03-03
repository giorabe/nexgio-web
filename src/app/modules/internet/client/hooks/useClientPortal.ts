import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/app/shared/supabaseClient";


type ClientPortalDTO = Record<string, any>;

function getStoredIdentifier() {
  return (
    localStorage.getItem("nexgio_client_id") ||
    localStorage.getItem("clientId") ||
    localStorage.getItem("client_username") ||
    ""
  ).trim();
}


export function useClientPortal() {
  const [client, setClient] = useState<ClientPortalDTO | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastIdentifierRef = useRef<string>("");

  // Normalize tier fields from view or direct
  const normalizeTierFields = (obj: any) => {
    if (!obj) return { tier_id: null, tier_name: null };
    return {
      tier_id:
        obj.tier_id ??
        obj.client_tier_id ??
        obj.client_tier_id_str ??
        obj.tier?.id ??
        obj.tier_id_str ??
        null,
      tier_name:
        obj.tier_name ??
        obj.client_tier ??
        obj.tier?.name ??
        obj.plan_name ??
        obj.tier_name_str ??
        null,
    };
  };

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const identifier = getStoredIdentifier();
      console.debug("[useClientPortal] identifier:", identifier);
      lastIdentifierRef.current = identifier;
      if (!identifier) {
        setClient(null);
        setInvoices([]);
        setPayments([]);
        setLoading(false);
        return;
      }
      // 1️⃣ Try unified client_portal_view first
      let { data, error } = await supabase
        .from("client_portal_view")
        .select("*")
        .or(`account_username.eq.${identifier},id.eq.${identifier}`)
        .maybeSingle();
      console.debug("[useClientPortal] client_portal_view result:", data, error);
      if (!error && data) {
        // Parse invoices/payments if present as JSON string
        let invoices: any[] = [];
        let payments: any[] = [];
        try {
          invoices = typeof data.invoices === 'string' ? JSON.parse(data.invoices) : (data.invoices ?? []);
        } catch { invoices = []; }
        try {
          payments = typeof data.payments === 'string' ? JSON.parse(data.payments) : (data.payments ?? []);
        } catch { payments = []; }
        const tierFields = normalizeTierFields(data);
        setClient({ ...data, ...tierFields });
        setInvoices(invoices);
        setPayments(payments);
        setLoading(false);
        return;
      }
      // 2️⃣ Fallback: client_interface view (legacy)
      let { data: v } = await supabase
        .from("client_interface")
        .select("*")
        .or(`account_username.eq.${identifier},id.eq.${identifier}`)
        .maybeSingle();
      if (v) {
        const clientId = v.client_id ?? v.id;
        const tierFields = normalizeTierFields(v);
        const flatClient: ClientPortalDTO = {
          ...v,
          id: clientId,
          ...tierFields,
          current_devices: Number(v.current_devices ?? 0),
          tier_device_limit: Number(v.tier_device_limit ?? 0),
          total_unpaid: Number(v.total_unpaid ?? 0),
          invoice_due_date: v.invoice_due_date ?? null,
          next_due_date: v.next_due_date ?? null,
        };
        setClient(flatClient);
        // Fetch invoices/payments from tables
        let { data: invData } = await supabase
          .from("invoices")
          .select("*")
          .eq("client_id", clientId);
        setInvoices(invData ?? []);
        let { data: payData } = await supabase
          .from("payments")
          .select("*")
          .eq("client_id", clientId);
        setPayments(payData ?? []);
        setLoading(false);
        return;
      }
      setClient(null);
      setInvoices([]);
      setPayments([]);
      setLoading(false);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const tick = () => {
      const now = getStoredIdentifier();
      if (now !== lastIdentifierRef.current) void reload();
    };
    const t = window.setInterval(tick, 600);
    return () => window.clearInterval(t);
  }, [reload]);

  return { client, invoices, payments, loading, error, reload } as const;
}