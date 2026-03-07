import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string; // ISO
  paid: boolean;
  created_at?: string;
};

type MonthlySettings = {
  amount: number;
  nextDueDate?: string;
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function useAdminExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthly, setMonthly] = useState<MonthlySettings>({ amount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const mod = await import("@/app/shared/supabaseClient");
        const { supabase } = mod;
        const res = await supabase.from("expenses").select("*").order("created_at", { ascending: false });
        const { data, error } = res as any;
        // eslint-disable-next-line no-console
        console.debug("supabase.select.expenses ->", { data, error });
        if (error) {
          throw new Error(error.message ?? JSON.stringify(error));
        }
        if (!mounted) return;
        const parsed: Expense[] = (data ?? []).map((r: any) => ({
          id: String(r.id),
          description: r.description ?? "",
          category: r.category ?? "",
          amount: Number(r.amount ?? 0),
          date: r.date ? new Date(r.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          paid: Boolean(r.paid),
          created_at: r.created_at,
        }));
        setExpenses(parsed);
        setError(null);
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error("load expenses error:", err);
        setError(String(err?.message ?? JSON.stringify(err)));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function addExpense({ description, amount, category, date, paid }: Omit<Expense, "id" | "paid"> & { paid?: boolean }) {
    const id = uid();
    const paidValue = paid === undefined ? true : Boolean(paid);
    const row = {
      id,
      description: description ?? "",
      category: category ?? "",
      amount: Number(amount) || 0,
      date: date ?? new Date().toISOString().slice(0, 10),
      paid: paidValue,
    };

    try {
      const mod = await import("@/app/shared/supabaseClient");
      const { supabase } = mod;
      const res = await supabase.from("expenses").insert(row).select();
      const { data, error } = res as any;
      // Debug log to help diagnose silent failures
      // eslint-disable-next-line no-console
      console.debug("supabase.insert.expenses ->", { requestRow: row, data, error });
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase insert error:", error);
        throw new Error(error.message ?? JSON.stringify(error));
      }
      if (!data || (Array.isArray(data) && data.length === 0)) {
        // No rows returned — often caused by RLS blocking the insert for anon role.
        const msg = "Insert succeeded but returned no rows — check Row Level Security (RLS) or permissions for the anon role.";
        // eslint-disable-next-line no-console
        console.warn(msg, { res });
        setError(msg);
        // still treat as success with optimistic local row
      }
      const inserted = (data && data[0]) || row;
      const e: Expense = {
        id: String(inserted.id),
        description: inserted.description ?? row.description,
        category: inserted.category ?? row.category,
        amount: Number(inserted.amount ?? row.amount) || 0,
        date: inserted.date ? new Date(inserted.date).toISOString().slice(0, 10) : row.date,
        paid: Boolean(inserted.paid ?? row.paid),
        created_at: inserted.created_at,
      };
      // Update local state but do NOT persist to localStorage — testing Supabase insert
      setExpenses((s) => [e, ...s]);
      setError(null);
      toast.success("Expense added", { duration: 3000, position: "top-right" });
      return e.id;
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("addExpense error:", err);
      const msg = String(err?.message ?? JSON.stringify(err));
      setError(msg);
      toast.error(msg, { duration: 5000, position: "top-right" });
      return null as any;
    }
  }

  async function togglePaid(id: string) {
    const prev = expenses;
    const idx = expenses.findIndex((x) => x.id === id);
    if (idx === -1) return;
    const newPaid = !expenses[idx].paid;
    const next = expenses.slice();
    next[idx] = { ...next[idx], paid: newPaid };
    setExpenses(next);
    try {
      const mod = await import("@/app/shared/supabaseClient");
      const { supabase } = mod;
      const res = await supabase.from("expenses").update({ paid: newPaid }).eq("id", id).select();
      const { data, error } = res as any;
      // eslint-disable-next-line no-console
      console.debug("supabase.update.expenses ->", { id, data, error });
      if (error) {
        // revert
        setExpenses(prev);
        const msg = String(error?.message ?? JSON.stringify(error));
        setError(msg);
        toast.error(msg, { duration: 5000, position: "top-right" });
      } else {
        toast.success("Expense updated", { duration: 3000, position: "top-right" });
      }
    } catch (err: any) {
      setExpenses(prev);
      // eslint-disable-next-line no-console
      console.error("togglePaid error:", err);
      const msg = String(err?.message ?? JSON.stringify(err));
      setError(msg);
      toast.error(msg, { duration: 5000, position: "top-right" });
    }
  }

  async function removeExpense(id: string) {
    // Optimistic UI remove
    const prev = expenses;
    const next = prev.filter((x) => x.id !== id);
    setExpenses(next);

    try {
      const mod = await import("@/app/shared/supabaseClient");
      const { supabase } = mod;
      const res = await supabase.from("expenses").delete().eq("id", id).select();
      const { data, error } = res as any;
      // eslint-disable-next-line no-console
      console.debug("supabase.delete.expenses ->", { id, data, error });
      if (error) {
        // revert
        setExpenses(prev);
        // eslint-disable-next-line no-console
        console.error("Supabase delete error:", error);
        const msg = String(error?.message ?? JSON.stringify(error));
        setError(msg);
        toast.error(msg, { duration: 5000, position: "top-right" });
        return;
      }
      // success
      toast.success("Expense removed", { duration: 3000, position: "top-right" });
    } catch (err: any) {
      // revert and show error
      setExpenses(prev);
      // eslint-disable-next-line no-console
      console.error("removeExpense error:", err);
      const msg = String(err?.message ?? JSON.stringify(err));
      setError(msg);
      toast.error(msg, { duration: 5000, position: "top-right" });
    }
  }

  function getPaidAmountForMonth(category: string, year?: number, month?: number) {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = month ?? now.getMonth();
    return expenses.reduce((acc, e) => {
      if (e.category !== category) return acc;
      const d = new Date(e.date);
      if (d.getFullYear() === y && d.getMonth() === m && e.paid) return acc + e.amount;
      return acc;
    }, 0);
  }

  const totals = useMemo(() => {
    const totalSpent = expenses.reduce((acc, e) => acc + (e.paid ? e.amount : 0), 0);
    const totalPending = expenses.reduce((acc, e) => acc + (!e.paid ? e.amount : 0), 0);
    const totalAll = expenses.reduce((acc, e) => acc + e.amount, 0);
    return { totalSpent, totalPending, totalAll };
  }, [expenses]);

  return {
    expenses,
    addExpense,
    togglePaid,
    removeExpense,
    monthly,
    setMonthly,
    totals,
    getPaidAmountForMonth,
    loading,
    error,
  } as const;
}

export default useAdminExpenses;
