import { useCallback, useState } from "react";
import type { ClientUI } from "../types/client.types";
import type { InvoiceCreateInput, InvoiceRow } from "../types/invoice.types";
import { useTiers } from "./useTiers";
import { fetchTierById } from "../services/tiers.service";
import {
  fetchInvoicesByClient,
  fetchInvoiceByClientMonth,
  fetchLatestInvoiceByClient,
  createInvoice as createInvoiceSvc,
  computeClientPreviousBalance,
  listInvoices as listInvoicesSvc,
  updateInvoiceStatus,
  patchInvoicePayment,
  deleteInvoice,
} from "../services/invoices.service";
import { createPayment } from "../services/payments.service";
import { updateClient } from "../services/clients.service";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function calcNextDueDateISO(startDateISO: string, now = new Date()): string {
  const start = new Date(startDateISO);
  if (Number.isNaN(start.getTime())) return "";

  const day = start.getDate();

  const lastDayOfMonth = (year: number, monthIndex: number) =>
    new Date(year, monthIndex + 1, 0).getDate();

  let y = now.getFullYear();
  let m = now.getMonth();

  const candidateDay = Math.min(day, lastDayOfMonth(y, m));
  let due = new Date(y, m, candidateDay);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (dueDateOnly <= today) {
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    const nextDay = Math.min(day, lastDayOfMonth(y, m));
    due = new Date(y, m, nextDay);
  }

  return formatISODate(due);
}

function invoiceMonthFromDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function useInvoices() {
  const { tiers } = useTiers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForClient = useCallback(async (clientId: string) => {
    setLoading(true);
    const res = await fetchInvoicesByClient(clientId);
    setLoading(false);
    if (res.error) throw res.error;
    return res.data ?? [];
  }, []);

  const createInvoiceForClient = useCallback(
    async (
      client: ClientUI,
      input: {
        invoiceNumber?: string | null;
        unregisteredOvercharge?: number;
        rebate?: number;
        previousBalance?: number;
        depositApplied?: number;
        paymentMethod?: string | null;
        // optional override: use caller-provided ISO due date instead of computing
        dueDate?: string;
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const now = new Date();
        let target = invoiceMonthFromDate(now); // YYYY-MM

        // Prefer latest invoice as authoritative base if exists: advance billing_month and due_date by 1 month
        const latestRes = await fetchLatestInvoiceByClient(client.id);
        let dueDateISO: string;

        // If caller provided explicit dueDate override (ISO), use it
        if (input.dueDate) {
          dueDateISO = input.dueDate;
        } else if (latestRes && latestRes.data) {
          const latest: any = latestRes.data;
          // latest.billing_month expected format YYYY-MM
          const [lyStr, lmStr] = String(latest.billing_month).split("-");
          let ly = Number(lyStr || new Date().getFullYear());
          let lm = Number(lmStr || (new Date().getMonth() + 1));
          // advance one month
          lm += 1;
          if (lm > 12) {
            lm = 1;
            ly += 1;
          }
          target = `${ly}-${String(lm).padStart(2, "0")}`;

          // compute new due date by adding one month to latest.due_date
          const addMonths = (isoDate: string, months: number) => {
            const d = new Date(isoDate);
            d.setMonth(d.getMonth() + months);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          };

          dueDateISO = latest.due_date ? addMonths(latest.due_date, 1) : formatISODate(new Date());
        } else {
          // Compute due date for target month using client's startDate anchor
          const [ty, tm] = target.split("-").map(Number);
          const startAnchor = new Date(client.startDate);
          const anchorDay = startAnchor.getDate();
          const lastDay = new Date(ty, tm, 0).getDate();
          const day = Math.min(anchorDay, lastDay);
          const dueDate = new Date(ty, tm - 1, day);
          dueDateISO = formatISODate(dueDate);
        }

        // Determine base price + device limit (authoritative)
        const EXTRA_DEVICE_RATE = 30;

        let tierPrice = 0;
        let tierDeviceLimit = 0;

        // try hook cache first
        const cachedTier = tiers.find((t) => t.id === client.tierId);
        if (cachedTier) {
          tierPrice = Number(cachedTier.price ?? 0);
          tierDeviceLimit = Number(cachedTier.deviceLimit ?? 0);
        } else {
          // fallback to DB (authoritative)
          const tierRes: any = await fetchTierById(client.tierId);
          if (tierRes?.error) throw tierRes.error;
          tierPrice = Number(tierRes?.data?.price ?? 0);
          tierDeviceLimit = Number(tierRes?.data?.device_limit ?? 0);
        }

        const clientDevices = Number(client.devices ?? 0);
        const extraDevices = Math.max(0, clientDevices - tierDeviceLimit);
        const extraDeviceCharge = extraDevices * EXTRA_DEVICE_RATE;

        const basePrice = tierPrice;

        const unregisteredOvercharge = input.unregisteredOvercharge ?? 0;
        // rebate is stored as percent (0-100)
        const rebate = input.rebate ?? 0;
        const chargesSubtotal = basePrice + extraDeviceCharge + unregisteredOvercharge;
        const rebateAmount = Number(((chargesSubtotal * Number(rebate)) / 100).toFixed(2));
        // Auto-compute previous balance if not provided by caller.
        // computeClientPreviousBalance now returns the most recent invoice's negative balance (credit)
        // or 0 when there's no credit.
        const previousBalance =
          input.previousBalance !== undefined && input.previousBalance !== null
            ? input.previousBalance
            : (await computeClientPreviousBalance(client.id));
        const depositApplied = input.depositApplied ?? 0;

        const totalAmount = Math.max(0, Number((chargesSubtotal - rebateAmount + previousBalance - depositApplied).toFixed(2)));

        // Generate invoice number (allow override from input); retry once if unique constraint fails
        // Format: NGS-YYYYMMDD-<4digits>
        const genNumber = () => {
          const d = new Date();
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
          return `NGS-${y}${m}${day}-${suffix}`;
        };
        let invoiceNumber = input.invoiceNumber ?? genNumber();

        const createPayload: InvoiceCreateInput = {
          clientId: client.id,
          invoiceNumber,
          billingMonth: target,
          invoiceDate: formatISODate(now),
          // persist dueDate chosen/provided by caller or derived above
          dueDate: dueDateISO,
          basePrice,
          extraDeviceCharge,
          unregisteredOvercharge,
          rebate,
          previousBalance,
          depositApplied,
          totalAmount,
          paymentStatus: "pending",
          // snapshot client info
          // @ts-ignore - extend payload for snapshot
          client_name: client.name,
          // @ts-ignore
          client_room: client.room,
          // @ts-ignore
          client_contact: client.contact,
          // @ts-ignore
          client_email: client.email,
          // initialize payment tracking
          // @ts-ignore
          amount_paid: 0,
          // @ts-ignore
          balance_due: totalAmount,
        };

        console.log("EXTRA DEVICE DEBUG", {
          clientDevices: client.devices,
          tierDeviceLimit,
          extraDevices,
          extraDeviceCharge,
        });

        console.log("INVOICE DEBUG BEFORE_CREATE", {
          extra_device_charge: createPayload.extraDeviceCharge,
          total_amount: createPayload.totalAmount,
          payload: createPayload,
        });

        let created = await createInvoiceSvc(createPayload);
        if (created.error && /unique/i.test(created.error.message)) {
          // retry once
          invoiceNumber = genNumber();
          createPayload.invoiceNumber = invoiceNumber;
          created = await createInvoiceSvc(createPayload);
        }

        if (created.error) throw created.error;

        // LOG: after createInvoice returns
        console.log("INVOICE DEBUG CREATED", {
          data: created.data,
          error: created.error,
          returned_extra_device_charge: created.data?.extra_device_charge,
        });

        const invoiceRow = created.data as InvoiceRow;

        // Compute next cycle due date (one month after invoice's due_date)
        const invoiceDue = new Date(invoiceRow.due_date);
        let ny = invoiceDue.getFullYear();
        let nm = invoiceDue.getMonth() + 1; // next month index
        if (nm > 11) {
          nm = 0;
          ny += 1;
        }
        const nextLastDayDate = new Date(ny, nm + 1, 0);
        // Ensure startAnchor exists (fall back to invoice dates or today)
        const startAnchor = new Date(invoiceRow.due_date ?? invoiceRow.invoice_date ?? new Date());
        const nextDay = Math.min(startAnchor.getDate(), nextLastDayDate.getDate());
        const nextDue = new Date(ny, nm, nextDay);
        const nextDueISO = formatISODate(nextDue);

        // Patch client next_due_date
        await updateClient(client.id, { next_due_date: nextDueISO } as any);

        setLoading(false);
        return { ok: true as const, invoice: invoiceRow };
      } catch (err: any) {
        setError(err?.message ?? String(err));
        setLoading(false);
        return { ok: false as const, error: err };
      }
    },
    [tiers]
  );

  // markAsPaid removed from hook — payments should be handled via PaymentsEntry and payment records

  const removeInvoice = useCallback(async (invoiceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteInvoice(invoiceId);
      setLoading(false);
      if ((res as any).error) throw (res as any).error;
      return { ok: true as const };
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setLoading(false);
      return { ok: false as const, error: err };
    }
  }, []);

  return { loading, error, fetchForClient, createInvoiceForClient, removeInvoice };
}


// additional helper to list recent invoices
export async function listRecentInvoices(limit = 50) {
  const res = await listInvoicesSvc(limit);
  if (res.error) throw res.error;
  return res.data ?? [];
}

