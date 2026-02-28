import { supabase } from "@/app/shared/supabaseClient";
import { listPaymentsByClient } from "@/app/modules/internet/admin/services/payments.service";
import { fetchInvoicesByClient } from "@/app/modules/internet/admin/services/invoices.service";

type ClientPortalResult = {
  client: Record<string, any>;
  invoices: any[];
  payments: any[];
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function fetchClientPortalByIdentifier(identifier: string) {
  // Step A: fetch client by uuid OR username
  const clientQuery = supabase.from("clients").select("*");

  const { data: clientRow, error: clientErr } = isUuid(identifier)
    ? await clientQuery.eq("id", identifier).maybeSingle()
    : await clientQuery.eq("account_username", identifier).maybeSingle();

  if (clientErr) return { data: null, error: clientErr };
  if (!clientRow) return { data: null, error: { message: "Client not found" } };

  // Step B: fetch tier
  const { data: tierRow, error: tierErr } = await supabase
    .from("tiers")
    .select("*")
    .eq("id", clientRow.tier_id)
    .maybeSingle();

  if (tierErr) console.warn("[ClientPortal] tier fetch error:", tierErr);

  // Step C: fetch invoices and compute totals
  const { data: invRows, error: invErr } = await fetchInvoicesByClient(clientRow.id);
  if (invErr) console.warn("[ClientPortal] invoices fetch error:", invErr);

  const invoices = invRows ?? [];

  const unpaid = invoices.filter((i: any) => {
    const status = String(i?.payment_status ?? i?.status ?? "").toLowerCase();
    return status !== "paid" && status !== "settled" && status !== "success";
  });

  const total_unpaid = unpaid.reduce((sum: number, i: any) => {
    return sum + Number(i?.balance_due ?? i?.total_amount ?? i?.amount ?? 0);
  }, 0);

  // nearest upcoming unpaid due date, else most recent due date
  let invoice_due_date: string | null = null;
  const today = new Date();

  const upcoming = unpaid
    .map((i: any) => ({ due: i?.due_date ? new Date(i.due_date) : null, row: i }))
    .filter((x: any) => x.due && x.due >= today)
    .sort((a: any, b: any) => a.due.getTime() - b.due.getTime());

  if (upcoming.length > 0) {
    invoice_due_date = upcoming[0].row?.due_date ?? null;
  } else if (unpaid.length > 0) {
    const sorted = unpaid
      .map((i: any) => i?.due_date)
      .filter(Boolean)
      .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
    invoice_due_date = sorted[0] ?? null;
  }

  // Step D: payments
  const { data: payRows, error: payErr } = await listPaymentsByClient(clientRow.id);
  if (payErr) console.warn("[ClientPortal] payments fetch error:", payErr);

  const client = {
    ...clientRow,

    // Flatten tier fields for dashboard
    tier_name: tierRow?.name ?? "Plan",
    tier_speed: tierRow?.speed ?? "-",
    tier_device_limit: Number(tierRow?.device_limit ?? 0),
    tier_price: tierRow?.price ?? null,       

    // Flatten billing fields for dashboard
    current_devices: Number(clientRow?.devices ?? 0),
    total_unpaid: Number(total_unpaid ?? 0),
    invoice_due_date,
    next_due_date: clientRow?.next_due_date ?? null,
  };

  const result: ClientPortalResult = {
    client,
    invoices,
    payments: payRows ?? [],
  };

  return { data: result, error: null };
}