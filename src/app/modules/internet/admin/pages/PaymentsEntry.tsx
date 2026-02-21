import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/app/shared/ui/button";
import { Input } from "@/app/shared/ui/input";
import { Label } from "@/app/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/shared/ui/select";
import { useClients } from "../hooks/useClients";
import {
  fetchInvoicesByClient,
  fetchLatestInvoiceByClient,
} from "../services/invoices.service";
import { formatDateMMDDYYYY } from "@/app/shared/utils/dateFormat";
import {
  createPayment,
  recomputeInvoiceFromPayments,
} from "../services/payments.service";
import { updateClient } from "../services/clients.service";
import type { InvoiceRow } from "../types/invoice.types";
import SuccessModal from "@/app/shared/components/modals/SuccessModal";

export default function PaymentsEntry() {
  const { clients, reload: reloadClients } = useClients();

  const [roomQuery, setRoomQuery] = useState("");
  const matches = useMemo(
    () => clients.filter((c) => c.room.toLowerCase().includes(roomQuery.toLowerCase())),
    [clients, roomQuery]
  );

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState<string>("0");
  const [method, setMethod] = useState<string>("Cash");

  function toMMDDYYYY(iso: string) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return "";
    return `${m}-${d}-${y}`;
  }

  function toISODate(mmddyyyy: string) {
    const cleaned = (mmddyyyy || "").trim();
    if (!/^\d{2}-\d{2}-\d{4}$/.test(cleaned)) return "";
    const [m, d, y] = cleaned.split("-");
    return `${y}-${m}-${d}`;
  }

  const [dateText, setDateText] = useState<string>(
    toMMDDYYYY(new Date().toISOString().slice(0, 10))
  );
  const [notes, setNotes] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const loadInvoicesForClient = async (clientId: string) => {
    try {
      const res = await fetchInvoicesByClient(clientId);
      const rows = (res.data ?? []) as InvoiceRow[];
      const pending = rows.filter(
        (r) => Number(r.balance_due ?? 0) > 0 || r.payment_status !== "paid"
      );
      setInvoices(pending);
      if (pending.length) setSelectedInvoiceId(pending[0].id);
      else setSelectedInvoiceId(null);
    } catch (e) {
      console.error(e);
      setInvoices([]);
    }
  };

  const handleSelectClient = async (id: string) => {
    setSelectedClientId(id);
    await loadInvoicesForClient(id);
  };

  useEffect(() => {
    const invoice = selectedInvoiceId
      ? invoices.find((i) => i.id === selectedInvoiceId) ?? null
      : null;
    if (paymentType === "full" && invoice) {
      const bal = Math.max(Number(invoice.balance_due ?? invoice.total_amount ?? 0), 0);
      setAmount(String(bal));
    }
  }, [selectedInvoiceId, paymentType, invoices]);

  const formatMoney = (v: number) => `₱${v.toFixed(2)}`;

  const handleSave = async () => {
    setMessage(null);
    if (!selectedClient) return setMessage("Select a client");
    if (isSavingPayment) return;
    setIsSavingPayment(true);
    try {
      const invoice = selectedInvoiceId
        ? invoices.find((i) => i.id === selectedInvoiceId) ?? null
        : null;

      if (!invoice) {
        if (Number(amount || 0) <= 0) return setMessage("Amount must be > 0");
        const isoDate = toISODate(dateText);
        if (!isoDate) return setMessage("Invalid date. Use MM-DD-YYYY");
        const res = await createPayment({
          client_id: selectedClientId,
          payment_type: "advance",
          amount: Number(amount || 0),
          payment_date: isoDate,
          payment_method: method,
          notes,
        });
        if (res?.error) {
          console.error("createPayment failed", res.error);
          setMessage(res.error.message ?? "Failed to record payment");
          return;
        }
        setSuccessMessage("Advance/credit recorded for client");
        setSuccessOpen(true);
      } else {
        const entered = Number(amount || 0);
        if (entered <= 0) return setMessage("Payment amount must be > 0");

        const refreshed = invoices.find((i) => i.id === invoice.id) ?? invoice;
        const balanceDueNow = Number(refreshed.balance_due ?? refreshed.total_amount ?? 0);
        const pType = entered >= balanceDueNow ? "full" : "partial";

        const isoDate = toISODate(dateText);
        if (!isoDate) return setMessage("Invalid date. Use MM-DD-YYYY");

        const res = await createPayment({
          client_id: selectedClient!.id,
          invoice_id: invoice.id,
          payment_type: String(pType).trim().toLowerCase() as any,
          amount: entered,
          payment_date: isoDate,
          payment_method: method,
          notes,
        });
        if (res?.error) {
          console.error("createPayment failed", res.error);
          setMessage(res.error.message ?? "Failed to record payment");
          return;
        }

        const recomputeRes = await recomputeInvoiceFromPayments(invoice.id);
        if (recomputeRes?.error) {
          const err = recomputeRes.error as any;
          console.error("recomputeInvoiceFromPayments failed", err);
          setMessage(err?.message || "Payment recorded but invoice recompute failed");
          return;
        }

        setSuccessMessage(
          entered >= balanceDueNow
            ? "Payment recorded (may be overpayment)"
            : "Partial payment recorded"
        );
        setSuccessOpen(true);
      }

      await reloadClients();
      if (selectedClientId) await loadInvoicesForClient(selectedClientId);
    } catch (e: any) {
      console.error(e);
      setMessage(e?.message ?? "Failed to record payment");
    } finally {
      setIsSavingPayment(false);
    }
  };

  const selectedInvoice = selectedInvoiceId
    ? invoices.find((i) => i.id === selectedInvoiceId) ?? null
    : null;

  const totalAmount = Number(selectedInvoice?.total_amount ?? 0);
  const amountPaid = Number(selectedInvoice?.amount_paid ?? 0);
  const balanceDue = Math.max(totalAmount - amountPaid, 0);

  const [previousBalance, setPreviousBalance] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const loadPrev = async () => {
      if (!selectedClient) return setPreviousBalance(0);
      try {
        const res = await fetchLatestInvoiceByClient(selectedClient.id);
        if (res?.error) return setPreviousBalance(0);
        const inv = res?.data ?? null;
        const lastBal = Number(inv?.balance_due ?? 0);
        if (mounted) setPreviousBalance(lastBal < 0 ? lastBal : 0);
      } catch (e) {
        if (mounted) setPreviousBalance(0);
      }
    };
    void loadPrev();
    return () => {
      mounted = false;
    };
  }, [selectedClient]);

  const depositAmount = selectedClient?.depositAmount ?? 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Payments Entry</h2>

      {/* Mobile: tighter padding */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-3 sm:p-4">
        {/* Mobile: single column. Desktop: 12-col */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left panel */}
          <div className="lg:col-span-4 lg:border-r lg:border-[#2A2A2A] lg:pr-4">
            {/* Mobile divider instead of right border */}
            <div className="space-y-4 lg:pb-0 pb-4 lg:border-b-0 border-b border-[#2A2A2A]">
              <div>
                <Label className="text-white" htmlFor="roomSearch">
                  Search by Room
                </Label>
                <Input
                  id="roomSearch"
                  aria-label="Search clients by room"
                  value={roomQuery}
                  onChange={(e) => setRoomQuery(e.target.value)}
                  placeholder="Type room number..."
                  className="bg-[#161616] text-white"
                />
              </div>

              <div>
                <Label className="text-white">Select Client</Label>
                <Select
                  value={selectedClientId ?? ""}
                  onValueChange={(v) => void handleSelectClient(v || "")}
                >
                  <SelectTrigger className="bg-[#161616] text-white">
                    <SelectValue placeholder="Choose client" />
                  </SelectTrigger>
                  <SelectContent>
                    {matches.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — {c.room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Invoices (pending)</Label>
                {/* Mobile: shorter max height */}
                <div className="space-y-2 max-h-48 sm:max-h-64 overflow-auto">
                  {invoices.length === 0 && (
                    <p className="text-sm text-[#A0A0A0]">No pending invoices</p>
                  )}
                  {invoices.map((inv) => (
                    <button
                      key={inv.id}
                      onClick={() => setSelectedInvoiceId(inv.id)}
                      className={`w-full text-left p-2 rounded-md ${
                        selectedInvoiceId === inv.id ? "bg-[#2A2A2A]" : "bg-transparent"
                      }`}
                    >
                      <div className="flex justify-between gap-3">
                        <div className="text-white truncate">{inv.invoice_number}</div>
                        <div className="text-[#A0A0A0] whitespace-nowrap">
                          {formatMoney(Number(inv.balance_due ?? inv.total_amount ?? 0))}
                        </div>
                      </div>
                      <div className="text-sm text-[#808080]">
                        Due: {formatDateMMDDYYYY(inv.due_date)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-8 lg:pl-4">
            {/* Mobile: stack cards. Desktop: 2 columns */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-[#161616] rounded-md p-4">
                <p className="text-sm text-[#A0A0A0]">Invoice</p>
                <p className="text-white font-medium">
                  {selectedInvoice?.invoice_number ?? "(no invoice selected)"}
                </p>
                <p className="text-sm text-[#A0A0A0] mt-2">Client</p>
                <p className="text-white">{selectedClient?.name ?? "-"}</p>
                <p className="text-sm text-[#A0A0A0]">
                  {selectedClient ? (selectedClient.status === "active" ? "Active" : "Inactive") : ""}
                </p>
              </div>

              <div className="bg-[#161616] rounded-md p-4">
                <p className="text-sm text-[#A0A0A0]">Summary</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between gap-3">
                    <span className="text-[#A0A0A0]">Total Amount</span>
                    <span className="text-white whitespace-nowrap">{formatMoney(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#A0A0A0]">Paid Amount</span>
                    <span className="text-white whitespace-nowrap">{formatMoney(amountPaid)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#A0A0A0]">Balance Due</span>
                    <span className="text-white whitespace-nowrap">{formatMoney(balanceDue)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#A0A0A0]">Previous Balance</span>
                    <span className="text-white whitespace-nowrap">{formatMoney(previousBalance)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#A0A0A0]">Deposit</span>
                    <span className="text-white whitespace-nowrap">{formatMoney(depositAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-[#161616] rounded-md p-4">
              {/* Mobile: stack. Desktop: 3 columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-white">Payment Type</Label>
                  <Select value={paymentType} onValueChange={(v) => setPaymentType(v as any)}>
                    <SelectTrigger className="bg-[#161616] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Amount</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e: any) => setAmount(e.target.value)}
                    className="bg-[#161616] text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">Payment Date</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM-DD-YYYY"
                    value={dateText}
                    onChange={(e) => setDateText(e.target.value)}
                    className="bg-[#161616] text-white"
                  />
                </div>
              </div>

              {/* Mobile: stack. Desktop: 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-white">Method</Label>
                  <Select value={method} onValueChange={setMethod as any}>
                    <SelectTrigger className="bg-[#161616] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="GCash">GCash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div />
              </div>

              <div className="mt-4">
                <Label className="text-white">Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-[#161616] text-white"
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSave} disabled={isSavingPayment} className="w-full bg-[#F5C400] text-black">
                  {isSavingPayment ? "Saving..." : "Save Payment"}
                </Button>
                {message && <p className="text-sm text-[#A0A0A0] mt-2">{message}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <SuccessModal
        open={successOpen}
        message={successMessage}
        onOk={() => {
          setSuccessOpen(false);
          // reset form lightly
          setAmount("0");
          setNotes("");
          setMessage(null);
        }}
      />
    </div>
  );
}