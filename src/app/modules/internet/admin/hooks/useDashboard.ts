import { useEffect, useMemo, useState } from "react";
import { useClients } from "@/app/modules/internet/admin/hooks/useClients";
import { listInvoices } from "@/app/modules/internet/admin/services/invoices.service";
import { listPaymentsAll } from "@/app/modules/internet/admin/services/payments.service";
import type { DashboardData, DashboardActivityItem } from "@/app/modules/internet/admin/types/dashboard.types";

function monthOf(dateStr?: string | null) {
  if (!dateStr) return "";
  // dateStr expected YYYY-MM-DD or full ISO; slice first 7 chars
  return String(dateStr).slice(0, 7);
}

function toISODateForSort(dateStr?: string | null) {
  if (!dateStr) return "";
  const s = String(dateStr);
  if (s.length === 10) return s + "T00:00:00";
  return s;
}

function relativeTimeShort(iso: string) {
  try {
    const then = new Date(iso);
    if (Number.isNaN(then.getTime())) return "";
    const now = new Date();
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 60 * 86400) return `${Math.floor(diff / 86400)}d ago`;
    return then.toLocaleDateString();
  } catch (e) {
    return "";
  }
}

export function useDashboard() {
  const { clients, loading: clientsLoading } = useClients();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        const [invRes, payRes] = await Promise.all([
          listInvoices(500),
          listPaymentsAll(),
        ]);

        const invoices = (invRes?.data ?? []) as any[];
        const payments = (payRes?.data ?? []) as any[];

        // Clients counts
        const totalClients = clients.length;
        const activeClients = clients.filter((c: any) => (c.status ?? "").toLowerCase() === "active").length;
        const suspendedClients = clients.filter((c: any) => (c.status ?? "").toLowerCase() === "suspended").length;
        const inactiveClients = totalClients - activeClients - suspendedClients;

        // Monthly revenue: sum applied payments (full/partial) for current month
        const monthlyRevenuePaid = payments
          .filter((p) => {
            const t = String(p?.payment_type ?? "").toLowerCase();
            if (t !== "full" && t !== "partial") return false;
            const m = monthOf(p.payment_date ?? p.created_at ?? null);
            return m === currentMonth;
          })
          .reduce((acc: number, p: any) => acc + Number(p.amount ?? 0), 0);

        // Pending invoices
        const pendingInvoicesCount = invoices.filter((inv) => Number(inv.balance_due ?? 0) > 0).length;

        // Overdue accounts: balance_due >0 and due_date < today (date-only)
        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const overdueInvoicesCount = invoices.filter((inv) => {
          const bal = Number(inv.balance_due ?? 0);
          if (bal <= 0) return false;
          const due = inv.due_date ?? null;
          if (!due) return false;
          const d = new Date(String(due));
          const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          return dOnly < todayOnly;
        }).length;

        // Revenue breakdown for current month (invoice-based)
        const invoicesInMonth = invoices.filter((inv) => {
          const m = monthOf(inv.invoice_date ?? inv.created_at ?? null);
          return m === currentMonth;
        });

        const revenueBreakdownMonth = {
          baseSubscriptions: invoicesInMonth.reduce((acc: number, inv: any) => acc + Number(inv.base_price ?? 0), 0),
          extraDevices: invoicesInMonth.reduce((acc: number, inv: any) => acc + Number(inv.extra_device_charge ?? 0), 0),
          overcharges: invoicesInMonth.reduce((acc: number, inv: any) => acc + Number(inv.unregistered_overcharge ?? 0), 0),
        };

        // Recent Activity: combine payments and invoices
        const paymentEvents: DashboardActivityItem[] = payments
          .filter((p) => {
            // include all payments as events (but only applied payments counted in revenue)
            return true;
          })
          .map((p) => {
            const clientName = p.clients?.name ?? p.client_name ?? "Unknown";
            const amt = Number(p.amount ?? 0);
            const method = p.payment_method ?? "";
            const dateISO = toISODateForSort(p.payment_date ?? p.created_at ?? "");
            return {
              id: `p_${p.id}`,
              type: "payment",
              clientName,
              label: `Payment recorded • ₱${amt.toLocaleString()}${method ? ` • ${method}` : ""}`,
              dateISO,
            } as DashboardActivityItem;
          });

        const invoiceEvents: DashboardActivityItem[] = invoices
          .map((inv) => {
            const clientName = inv.clients?.name ?? inv.client_name ?? "Unknown";
            const label = `Invoice created • ${inv.invoice_number ?? "#"} • ₱${Number(inv.total_amount ?? 0).toLocaleString()}`;
            const dateISO = toISODateForSort(inv.invoice_date ?? inv.created_at ?? "");
            return {
              id: `i_${inv.id}`,
              type: "invoice",
              clientName,
              label,
              dateISO,
            } as DashboardActivityItem;
          });

        const recentActivity = (paymentEvents.concat(invoiceEvents))
          .filter((a) => a.dateISO)
          .sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || ""))
          .slice(0, 10);

        const out: DashboardData = {
          totalClients,
          activeClients,
          suspendedClients,
          inactiveClients,
          monthlyRevenuePaid: Number(monthlyRevenuePaid ?? 0),
          pendingInvoicesCount,
          overdueInvoicesCount,
          revenueBreakdownMonth,
          recentActivity,
        };

        if (mounted) setData(out);
      } catch (e: any) {
        console.error("useDashboard.load", e);
        if (mounted) setError(String(e?.message ?? e));
      }

      if (mounted) setLoading(false);
    };

    // Only load after clients are available
    if (!clientsLoading) void load();

    return () => {
      mounted = false;
    };
  }, [clients, clientsLoading]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      // re-run effect by toggling a small delay - easiest is to call the effect's load via changing nothing
      // instead just call the same list endpoints here
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const [invRes, payRes] = await Promise.all([listInvoices(500), listPaymentsAll()]);
      const invoices = (invRes?.data ?? []) as any[];
      const payments = (payRes?.data ?? []) as any[];

      const monthlyRevenuePaid = payments
        .filter((p) => {
          const t = String(p?.payment_type ?? "").toLowerCase();
          if (t !== "full" && t !== "partial") return false;
          const m = monthOf(p.payment_date ?? p.created_at ?? null);
          return m === currentMonth;
        })
        .reduce((acc: number, p: any) => acc + Number(p.amount ?? 0), 0);

      const invoicesInMonth = invoices.filter((inv) => {
        const m = monthOf(inv.invoice_date ?? inv.created_at ?? null);
        return m === currentMonth;
      });

      const revenueBreakdownMonth = {
        baseSubscriptions: invoicesInMonth.reduce((acc: number, inv: any) => acc + Number(inv.base_price ?? 0), 0),
        extraDevices: invoicesInMonth.reduce((acc: number, inv: any) => acc + Number(inv.extra_device_charge ?? 0), 0),
        overcharges: invoicesInMonth.reduce((acc: number, inv: any) => acc + Number(inv.unregistered_overcharge ?? 0), 0),
      };

      const paymentEvents: DashboardActivityItem[] = payments.map((p) => {
        const clientName = p.clients?.name ?? p.client_name ?? "Unknown";
        const amt = Number(p.amount ?? 0);
        const method = p.payment_method ?? "";
        const dateISO = toISODateForSort(p.payment_date ?? p.created_at ?? "");
        return {
          id: `p_${p.id}`,
          type: "payment",
          clientName,
          label: `Payment recorded • ₱${amt.toLocaleString()}${method ? ` • ${method}` : ""}`,
          dateISO,
        } as DashboardActivityItem;
      });

      const invoiceEvents: DashboardActivityItem[] = invoices.map((inv) => {
        const clientName = inv.clients?.name ?? inv.client_name ?? "Unknown";
        const label = `Invoice created • ${inv.invoice_number ?? "#"} • ₱${Number(inv.total_amount ?? 0).toLocaleString()}`;
        const dateISO = toISODateForSort(inv.invoice_date ?? inv.created_at ?? "");
        return {
          id: `i_${inv.id}`,
          type: "invoice",
          clientName,
          label,
          dateISO,
        } as DashboardActivityItem;
      });

      const recentActivity = (paymentEvents.concat(invoiceEvents))
        .filter((a) => a.dateISO)
        .sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || ""))
        .slice(0, 10);

      const totalClients = clients.length;
      const activeClients = clients.filter((c: any) => (c.status ?? "").toLowerCase() === "active").length;
      const suspendedClients = clients.filter((c: any) => (c.status ?? "").toLowerCase() === "suspended").length;
      const inactiveClients = totalClients - activeClients - suspendedClients;

      const pendingInvoicesCount = invoices.filter((inv) => Number(inv.balance_due ?? 0) > 0).length;
      const today = new Date();
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const overdueInvoicesCount = invoices.filter((inv) => {
        const bal = Number(inv.balance_due ?? 0);
        if (bal <= 0) return false;
        const due = inv.due_date ?? null;
        if (!due) return false;
        const d = new Date(String(due));
        const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        return dOnly < todayOnly;
      }).length;

      const out = {
        totalClients,
        activeClients,
        suspendedClients,
        inactiveClients,
        monthlyRevenuePaid: Number(monthlyRevenuePaid ?? 0),
        pendingInvoicesCount,
        overdueInvoicesCount,
        revenueBreakdownMonth,
        recentActivity,
      } as DashboardData;

      setData(out);
    } catch (e: any) {
      console.error("useDashboard.refresh", e);
      setError(String(e?.message ?? e));
    }
    setLoading(false);
  };

  const formatted = useMemo(() => {
    if (!data) return null;
    return {
      ...data,
      // attach helper for relative strings if consumer wants quick access
      recentActivity: data.recentActivity.map((r) => ({ ...r, relative: relativeTimeShort(r.dateISO) } as any)),
    } as DashboardData & { recentActivity: (DashboardActivityItem & { relative?: string })[] };
  }, [data]);

  return { data, loading: loading || clientsLoading, error, refresh, formatted } as const;
}

export type UseDashboardReturn = ReturnType<typeof useDashboard>;
