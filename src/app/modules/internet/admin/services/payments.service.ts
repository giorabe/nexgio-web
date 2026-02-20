import { supabase } from "@/app/shared/supabaseClient";
import { patchInvoicePayment } from "./invoices.service";

export type PaymentRow = {
  id: string;
  client_id: string | null;
  invoice_id?: string | null;
  payment_type: "full" | "partial" | "advance" | "advance_apply";
  amount: number;
  payment_date: string; // YYYY-MM-DD
  payment_method?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function listPaymentsByInvoice(invoiceId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*, clients(id,name,room,contact,email)")
    .eq("invoice_id", invoiceId)
    .order("payment_date", { ascending: false });

  if (error) {
    console.error("payments.service.listPaymentsByInvoice error:", { invoiceId, error });
  }

  return { data, error };
}

// Returns payments rows joined with invoice fields (if FK exists)
export async function listPaymentsWithInvoice(invoiceId: string) {
  // Try a single query that joins invoices; if the DB doesn't allow this (no FK),
  // callers can fallback to listPaymentsByInvoice + fetchInvoiceById.
  return supabase
    .from("payments")
    .select(`*, clients(id,name,room,contact,email), invoices(id,invoice_number,invoice_date,due_date,base_price,extra_device_charge,unregistered_overcharge,rebate,previous_balance,deposit_applied,total_amount,amount_paid,balance_due,payment_status,payment_date,payment_method)`)
    .eq("invoice_id", invoiceId)
    .order("payment_date", { ascending: false });
}

export async function listAdvancePaymentsForClientOnDate(clientId: string, paymentDate: string) {
  return supabase
    .from("payments")
    .select("*")
    .eq("client_id", clientId)
    .eq("payment_type", "advance")
    .eq("payment_date", paymentDate)
    .order("created_at", { ascending: false });
}

export async function listPaymentsByClient(clientId: string) {
  return supabase
    .from("payments")
    .select("*, invoices(id,invoice_number,total_amount,amount_paid,balance_due)")
    .eq("client_id", clientId)
    .order("payment_date", { ascending: false })
    .returns<PaymentRow[]>();
}

export async function createPayment(input: {
  client_id: string | null;
  invoice_id?: string | null;
  payment_type: "full" | "partial" | "advance" | "advance_apply";
  amount: number;
  payment_date: string; // YYYY-MM-DD
  payment_method?: string | null;
  notes?: string | null;
}) {
  const row = {
    client_id: input.client_id,
    invoice_id: input.invoice_id ?? null,
    payment_type: input.payment_type,
    amount: input.amount,
    payment_date: input.payment_date,
    payment_method: input.payment_method ?? null,
    notes: input.notes ?? null,
  };

  const res = await supabase
    .from("payments")
    .insert(row)
    .select("*")
    .single();

  // Recompute invoice totals if this payment is linked to an invoice
  try {
    const invoiceId = (res.data as any)?.invoice_id;
    if (invoiceId) {
      await recomputeInvoiceFromPayments(invoiceId);
    }
  } catch (e) {
    console.error("createPayment: recomputeInvoiceFromPayments failed", e);
  }

  return res;
}

export async function updatePayment(id: string, patch: Partial<PaymentRow>) {
  const res = await supabase
    .from("payments")
    .update(patch as Record<string, unknown>)
    .eq("id", id)
    .select("*")
    .single();

  if (res.error) throw res.error;

  // Recompute invoice totals for the affected invoice (if any)
  try {
    const invoiceId = (res.data as any)?.invoice_id ?? (patch as any).invoice_id;
    if (invoiceId) {
      await recomputeInvoiceFromPayments(String(invoiceId));
    }
  } catch (e) {
    console.error("updatePayment: recomputeInvoiceFromPayments failed", e);
  }

  return res;
}

export async function deletePayment(id: string) {
  const res = await supabase
    .from("payments")
    .delete()
    .eq("id", id)
    .select("*")
    .single();

  if (res.error) throw res.error;

  // Recompute invoice totals for the invoice linked to the deleted payment
  try {
    const invoiceId = (res.data as any)?.invoice_id;
    if (invoiceId) {
      await recomputeInvoiceFromPayments(String(invoiceId));
    }
  } catch (e) {
    console.error("deletePayment: recomputeInvoiceFromPayments failed", e);
  }

  return res;
}

export async function deletePaymentsByInvoice(invoiceId: string) {
  return supabase.from("payments").delete().eq("invoice_id", invoiceId);
}

export async function sumPaymentsForInvoice(invoiceId: string) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("amount")
      .eq("invoice_id", invoiceId)
      .in("payment_type", ["full", "partial"]);

    if (error) {
      console.error("payments.service.sumPaymentsForInvoice error:", { invoiceId, error });
      return { sum: 0, error };
    }

    const sum = (data ?? []).reduce((acc: number, r: any) => acc + Number(r.amount ?? 0), 0);
    return { sum, error: null };
  } catch (err) {
    console.error("payments.service.sumPaymentsForInvoice unexpected error:", err);
    return { sum: 0, error: err };
  }
}

export async function listPaymentsAll() {
  return supabase
    .from("payments")
    .select(`*, clients(id,name,room,contact,email), invoices(id,invoice_number,base_price,extra_device_charge,unregistered_overcharge,rebate,previous_balance,deposit_applied,total_amount,amount_paid,balance_due,payment_status,invoice_date,due_date)`)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });
}

// Sum of payments for an invoice that occurred BEFORE the provided current payment.
// Only counts payment types 'partial' or 'full' and excludes the current payment id.
export async function sumPreviousPaid(invoiceId: string, currentPayment: { id: string | number; payment_date?: string | null; created_at?: string | null }) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("id,amount,payment_date,created_at,payment_type")
      .eq("invoice_id", invoiceId)
      .in("payment_type", ["partial", "full"])
      .neq("id", currentPayment.id)
      .order("payment_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("payments.service.sumPreviousPaid error:", { invoiceId, currentPayment, error });
      return { sum: 0, error };
    }

    const payments = data ?? [];

    const curDate = currentPayment.payment_date ?? null;
    const curCreated = currentPayment.created_at ?? null;

    const isBefore = (p: any) => {
      const pDate = p.payment_date ?? null;
      const pCreated = p.created_at ?? null;

      // If both have payment_date, compare lexicographically (YYYY-MM-DD)
      if (curDate && pDate) {
        if (pDate < curDate) return true;
        if (pDate > curDate) return false;
        // equal dates -> compare created_at
        if (pCreated && curCreated) return pCreated < curCreated;
        return false;
      }

      // If only p has a payment_date and current doesn't, treat p as not before
      if (pDate && !curDate) return false;

      // If current has a payment_date and p doesn't, p cannot be before by date
      if (!pDate && curDate) return false;

      // Both payment_date null -> compare created_at
      if (!pDate && !curDate) {
        if (pCreated && curCreated) return pCreated < curCreated;
        return false;
      }

      return false;
    };

    const sum = (payments as any[])
      .filter((p) => isBefore(p))
      .reduce((acc: number, r: any) => acc + Number(r.amount ?? 0), 0);

    return { sum, error: null };
  } catch (err) {
    console.error("sumPreviousPaid unexpected error", err);
    return { sum: 0, error: err };
  }
}

export async function recomputeInvoiceFromPayments(invoiceId: string) {
  try {
    const { data: payments, error: payErr } = await supabase
      .from("payments")
      .select("amount,payment_type,payment_date,payment_method")
      .eq("invoice_id", invoiceId);

    if (payErr) {
      console.error("recomputeInvoiceFromPayments: failed to fetch payments", payErr);
      return { error: payErr };
    }

    const appliedSum = (payments ?? [])
      .filter((p: any) => {
        const t = String(p?.payment_type ?? "").trim().toLowerCase();
        return t === "full" || t === "partial";
      })
      .reduce((acc: number, p: any) => acc + Number(p.amount ?? 0), 0);

    // Log recompute inputs
    try {
      console.log("[INV] recompute patch", { invoiceId, appliedSum });
    } catch (e) {
      // ignore
    }

    // fetch invoice to get total_amount
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .select("id,total_amount")
      .eq("id", invoiceId)
      .limit(1)
      .single();

    if (invErr) {
      console.error("recomputeInvoiceFromPayments: failed to fetch invoice", invErr);
      return { error: invErr };
    }

    const total = Number(inv.total_amount ?? 0);
    // Allow negative balance_due (overpayment -> credit). Do not clamp to 0.
    const newBalance = total - appliedSum;
    const newStatus = newBalance <= 0 ? "paid" : "pending";

    // pick latest payment_date/method when fully paid
    const latestPayment = (payments ?? []).slice().sort((a: any, b: any) => (b.payment_date || "") .localeCompare(a.payment_date || ""))[0];
    const patch: any = {
      amount_paid: appliedSum,
      balance_due: newBalance,
      payment_status: newStatus,
    };
    if (newStatus === "paid") {
      patch.payment_date = latestPayment?.payment_date ?? null;
      patch.payment_method = latestPayment?.payment_method ?? null;
      patch.paid_at = new Date().toISOString();
    }

    const updated = await patchInvoicePayment(invoiceId, patch as any);

    try {
      console.log("[INV] recompute result", { data: updated.data, error: updated.error });
    } catch (e) {
      // ignore
    }

    // Notify other windows/components to refresh invoice lists
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("invoices:updated", { detail: { invoiceId } }));
      }
    } catch (e) {
      // ignore
    }

    return { data: updated.data ?? null, error: updated.error ?? null };
  } catch (err) {
    console.error("recomputeInvoiceFromPayments unexpected error", err);
    return { error: err };
  }
}
