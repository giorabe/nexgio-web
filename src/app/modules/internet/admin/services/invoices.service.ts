import { supabase } from "@/app/shared/supabaseClient";
import type { InvoiceRow, InvoiceCreateInput, InvoiceStatus, InvoiceRowWithClient } from "../types/invoice.types";
import { updateClient } from "./clients.service";

const SELECT_FIELDS = `id,client_id,client_name,client_room,client_contact,client_email,invoice_number,billing_month,invoice_date,due_date,base_price,extra_device_charge,unregistered_overcharge,rebate,previous_balance,deposit_applied,total_amount,amount_paid,balance_due,payment_status,payment_date,paid_at,payment_method,created_at,updated_at`;

// include client basic fields (tier_id can be used on client side to lookup tier info)
const SELECT_FIELDS_WITH_CLIENT = `id,client_id,client_name,client_room,client_contact,client_email,invoice_number,billing_month,invoice_date,due_date,base_price,extra_device_charge,unregistered_overcharge,rebate,previous_balance,deposit_applied,total_amount,amount_paid,balance_due,payment_status,payment_date,paid_at,payment_method,created_at,updated_at,clients(name,room,contact,email,tier_id)`;

export async function fetchInvoicesByClient(clientId: string) {
  return supabase
    .from("invoices")
    .select(SELECT_FIELDS)
    .eq("client_id", clientId)
    .order("invoice_date", { ascending: false })
    .returns<InvoiceRow[]>();
}

export async function fetchInvoiceByClientMonth(clientId: string, billingMonth: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select(SELECT_FIELDS)
    .eq("client_id", clientId)
    .eq("billing_month", billingMonth)
    .limit(1)
    .single()
    .returns<InvoiceRow>();

  return { data, error };
}

export async function fetchLatestInvoiceByClient(clientId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select(SELECT_FIELDS)
    .eq("client_id", clientId)
    .order("due_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("invoices.service.fetchLatestInvoiceByClient error:", { clientId, error });
  }

  return { data, error };
}

export async function fetchInvoiceById(invoiceId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select(SELECT_FIELDS)
    .eq("id", invoiceId)
    .limit(1)
    .single()
    .returns<InvoiceRow>();

  return { data, error };
}

export async function createInvoice(input: InvoiceCreateInput) {
  const insertRow: Record<string, unknown> = {
    client_id: input.clientId,
    invoice_number: input.invoiceNumber,
    billing_month: input.billingMonth,
    invoice_date: input.invoiceDate,
    due_date: input.dueDate,
    base_price: input.basePrice,
    extra_device_charge: input.extraDeviceCharge ?? 0,
    unregistered_overcharge: input.unregisteredOvercharge ?? 0,
    rebate: input.rebate ?? 0,
    previous_balance: input.previousBalance ?? 0,
    deposit_applied: input.depositApplied ?? 0,
    total_amount: input.totalAmount,
    payment_status: input.paymentStatus ?? "pending",
    payment_date: input.paymentDate ?? null,
    payment_method: input.paymentMethod ?? null,
    // snapshot fields and payment tracking
    client_name: (input as any).client_name ?? null,
    client_room: (input as any).client_room ?? null,
    client_contact: (input as any).client_contact ?? null,
    client_email: (input as any).client_email ?? null,
    amount_paid: (input as any).amount_paid ?? 0,
    balance_due: (input as any).balance_due ?? (input.totalAmount ?? 0),
  };

  // If invoice total or balance indicates nothing to pay, mark as paid
  try {
    const total = Number(insertRow.total_amount ?? 0);
    const bal = Number(insertRow.balance_due ?? total);
    if (total <= 0 || bal <= 0) {
      insertRow.balance_due = 0;
      insertRow.payment_status = "paid";
      insertRow.amount_paid = total;
      insertRow.payment_date = insertRow.payment_date ?? insertRow.invoice_date ?? new Date().toISOString().slice(0, 10);
      insertRow.paid_at = insertRow.paid_at ?? new Date().toISOString();
    }
  } catch (e) {
    // ignore and continue
  }

  return supabase
    .from("invoices")
    .insert(insertRow)
    .select(SELECT_FIELDS)
    .single()
    .returns<InvoiceRow>();
}

export async function updateInvoice(invoiceId: string, patch: Partial<InvoiceRow>) {
  // Map UI camelCase fields to DB snake_case where necessary
  const dbPatch: Record<string, unknown> = { ...(patch as Record<string, unknown>) };
  if ((patch as any).dueDate !== undefined) {
    dbPatch.due_date = (patch as any).dueDate;
    delete dbPatch.dueDate;
  }

  return supabase
    .from("invoices")
    .update(dbPatch)
    .eq("id", invoiceId)
    .select(SELECT_FIELDS)
    .single()
    .returns<InvoiceRow>();
}

export async function deleteInvoice(invoiceId: string) {
  try {
    // attempt to fetch the invoice first to get client id
    const { data: invoiceRow, error: fetchErr } = await supabase
      .from("invoices")
      .select("id,client_id,due_date")
      .eq("id", invoiceId)
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.error("deleteInvoice: failed to fetch invoice before delete", fetchErr);
    }

    // perform delete
    const delRes = await supabase.from("invoices").delete().eq("id", invoiceId).select(SELECT_FIELDS).single();

    // If we have a client id, compute the latest remaining invoice due_date and update client's next_due_date
    const clientId = invoiceRow?.client_id ?? (delRes.data as any)?.client_id;
    if (clientId) {
      try {
        const { data: latest, error: latestErr } = await supabase
          .from("invoices")
          .select("due_date")
          .eq("client_id", clientId)
          .order("due_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestErr) {
          console.error("deleteInvoice: failed to fetch latest invoice for client", latestErr);
        }

        const nextDue = latest?.due_date ?? null;
        // update client next_due_date (set to null if none remain)
        try {
          await updateClient(clientId, { next_due_date: nextDue } as any);
        } catch (e) {
          console.error("deleteInvoice: failed to update client next_due_date", e);
        }
      } catch (e) {
        console.error("deleteInvoice: error while updating client next_due_date", e);
      }
    }

    return delRes;
  } catch (err) {
    console.error("deleteInvoice unexpected error", err);
    // fall back to simple delete attempt
    return supabase.from("invoices").delete().eq("id", invoiceId);
  }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  patch: { payment_status: InvoiceStatus; payment_date?: string | null; payment_method?: string | null }
) {
  return supabase
    .from("invoices")
    .update(patch as Record<string, unknown>)
    .eq("id", invoiceId)
    .select(SELECT_FIELDS)
    .single()
    .returns<InvoiceRow>();
}

export async function patchInvoicePayment(
  invoiceId: string,
  patch: { amount_paid?: number; balance_due?: number; payment_status?: InvoiceStatus; payment_date?: string | null; payment_method?: string | null; paid_at?: string | null }
) {
  return supabase
    .from("invoices")
    .update(patch as Record<string, unknown>)
    .eq("id", invoiceId)
    .select(SELECT_FIELDS)
    .single()
    .returns<InvoiceRow>();
}

export async function listInvoices(limit = 50) {
  // Fetch with joined client data for display
  return supabase
    .from("invoices")
    .select(SELECT_FIELDS_WITH_CLIENT)
    .order("invoice_date", { ascending: false })
    .limit(limit)
    .returns<InvoiceRowWithClient[]>();
}

/**
 * Compute the previous balance for a client.
 * - Sums all unpaid invoice balances for the client (uses `balance_due` if present,
 *   otherwise computes `total_amount - amount_paid`).
 * - Previously subtracted client's `credit_balance`; now derives previous balance
 *   from the latest invoice's balance_due (negative = client credit).
 * - Optionally exclude an invoice id (when computing before patching an existing invoice).
 */
export async function computeClientPreviousBalance(clientId: string, excludeInvoiceId?: string) {
  try {
    // For future invoices, derive "previous balance" from the most recent invoice's balance.
    // If the last invoice has a negative balance_due (credit), return that negative value.
    // Otherwise return 0.
    const { data: latestInv, error: invErr } = await supabase
      .from("invoices")
      .select("id,balance_due")
      .eq("client_id", clientId)
      .order("invoice_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invErr) {
      console.error("computeClientPreviousBalance: fetch latest invoice error", invErr);
      return 0;
    }

    const lastBalance = Number((latestInv as any)?.balance_due ?? 0);
    return lastBalance < 0 ? lastBalance : 0;
  } catch (err) {
    console.error("computeClientPreviousBalance unexpected error", err);
    return 0;
  }
}
