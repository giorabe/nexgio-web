import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchClientInterfaceByIdentifier,
} from "@/app/modules/internet/admin/services/clients.service";
import { fetchInvoicesByClient } from "@/app/modules/internet/admin/services/invoices.service";
import { listPaymentsByClient } from "@/app/modules/internet/admin/services/payments.service";
import { fetchClientPortalByIdentifier } from "@/app/modules/internet/client/services/clientPortal.service";
import type { InvoiceRow } from "@/app/modules/internet/admin/types/invoice.types";

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
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lastIdentifierRef = useRef<string>("");

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
      lastIdentifierRef.current = identifier;

      if (!identifier) {
        setClient(null);
        setInvoices([]);
        setPayments([]);
        setLoading(false);
        return;
      }

      console.log("🔎 CLIENT IDENTIFIER:", identifier);

      // ==============================
      // 1️⃣ PRIMARY: Admin-like direct fetch
      // ==============================
      const direct = await fetchClientPortalByIdentifier(identifier);

      if (!direct.error && direct.data) {
        console.log("✅ Using admin-like direct fetch");

        const { client: c, invoices: invs, payments: pays } = direct.data as any;

        const tierFields = normalizeTierFields(c);

        setClient({
          ...c,
          ...tierFields,
          current_devices: Number(c?.current_devices ?? 0),
          tier_device_limit: Number(c?.tier_device_limit ?? 0),
          total_unpaid: Number(c?.total_unpaid ?? 0),
        });

        setInvoices((invs ?? []) as InvoiceRow[]);
        setPayments(pays ?? []);

        console.debug("📦 FINAL CLIENT OBJECT (direct):", { ...c, ...tierFields });
        setLoading(false);
        return;
      }

      console.warn("⚠️ Direct fetch failed, falling back to view");

      // ==============================
      // 2️⃣ FALLBACK: client_interface view
      // ==============================
      const { data: viewRow } = await fetchClientInterfaceByIdentifier(identifier);

      if (viewRow) {
        console.log("✅ Using client_interface fallback");

        const v = viewRow as any;
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

        const { data: invData } = await fetchInvoicesByClient(clientId);
        const invoicesArr: InvoiceRow[] = (invData ?? []) as InvoiceRow[];
        setInvoices(invoicesArr);

        const { data: payData } = await listPaymentsByClient(clientId);
        setPayments(payData ?? []);

        console.debug("📦 FINAL CLIENT OBJECT (view):", flatClient);
        setLoading(false);
        return;
      }

      console.warn("❌ No client found.");
      setClient(null);
      setInvoices([]);
      setPayments([]);
      setLoading(false);

    } catch (e: any) {
      console.error("🔥 CLIENT PORTAL ERROR:", e);
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