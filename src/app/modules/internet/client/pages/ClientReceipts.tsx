import { useState } from "react";
import { Search, Download, Eye, Calendar, CheckCircle } from "lucide-react";
import { Input } from "@/app/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/shared/ui/select";
import { Button } from "@/app/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/shared/ui/dialog";
import { useClientPortal } from "@/app/modules/internet/client/hooks/useClientPortal";
import ReceiptTemplate, { exportReceiptToPng } from "@/app/modules/internet/admin/components/ReceiptTemplate";
import { sumPreviousPaid } from "@/app/modules/internet/admin/services/payments.service";
import { fetchInvoiceById, fetchInvoiceByNumber } from "@/app/modules/internet/admin/services/invoices.service";

export default function ClientReceipts() {
  const { client, payments = [], invoices: portalInvoices = [], loading: portalLoading } = useClientPortal();
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [previousPaid, setPreviousPaid] = useState<number>(0);

  const receipts = Array.isArray(payments) ? payments : [];

  // build a quick lookup from portal invoices so we can display the human-friendly invoice number
  const invoiceLookup = new Map<string, any>();
  if (Array.isArray(portalInvoices)) {
    for (const inv of portalInvoices) {
      const key = String(inv.id ?? inv.invoice_number ?? inv.invoiceNumber ?? "");
      if (key) invoiceLookup.set(key, inv);
    }
  }

  const filteredReceipts = receipts.filter((receipt: any) => {
    const id = String(receipt.id ?? "");
    const invoiceId = String(receipt.invoice_id ?? (receipt.invoices?.invoice_number ?? ""));
    const period = String(receipt.payment_date ?? "");
    const matchesSearch =
      id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === "all" || String(receipt.payment_method ?? "") === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalPaid = receipts.reduce((sum: number, r: any) => sum + Number(r.amount ?? 0), 0);
  const paymentMethods = Array.from(new Set(receipts.map((r: any) => r.payment_method ?? ""))).filter(Boolean);

  const openReceipt = async (r: any) => {
    // clone to avoid mutating source array
    const receiptCopy = { ...(r || {}) } as any;
    console.debug("ClientReceipts.openReceipt: incoming receipt", receiptCopy);
    // If receipt contains invoices as JSON string, parse it
    if (typeof receiptCopy.invoices === "string") {
      try {
        receiptCopy.invoices = JSON.parse(receiptCopy.invoices);
      } catch (e) {
        // ignore parse errors
      }
    }
    // If this payment references an invoice, fetch the invoice row and attach it
    // helper to normalize invoice object to admin shape (snake_case)
    const normalizeInv = (inv: any) => {
      if (!inv) return inv;
      const out: any = { ...(inv as any) };
      // map camelCase -> snake_case expected by template
      out.base_price = out.base_price ?? out.basePrice ?? out.base_price_amount ?? 0;
      out.extra_device_charge = out.extra_device_charge ?? out.extraDeviceCharge ?? out.extra_device_charge ?? 0;
      out.unregistered_overcharge = out.unregistered_overcharge ?? out.unregisteredOvercharge ?? 0;
      out.rebate = out.rebate ?? out.rebatePercent ?? out.rebate_amount ?? 0;
      out.other_fee = out.other_fee ?? out.otherFee ?? 0;
      out.deposit_applied = out.deposit_applied ?? out.depositApplied ?? 0;
      out.total_amount = out.total_amount ?? out.totalAmount ?? out.total ?? 0;
      out.amount_paid = out.amount_paid ?? out.amountPaid ?? out.amount_paid ?? 0;
      out.balance_due = out.balance_due ?? out.balanceDue ?? Math.max(0, (out.total_amount ?? 0) - (out.amount_paid ?? 0));
      return out;
    };

    if (receiptCopy?.invoices) {
      // normalize embedded invoice if present
      receiptCopy.invoices = normalizeInv(receiptCopy.invoices);
    }

    // If invoice_id missing but invoice number/string is present, try fetch by number
    const invoiceNumberFromReceipt = receiptCopy.invoices?.invoice_number ?? receiptCopy.invoice_number ?? receiptCopy.invoiceNumber ?? receiptCopy.invoiceId ?? null;
    if (!receiptCopy?.invoice_id && invoiceNumberFromReceipt) {
      try {
        const { data: invByNum, error: invNumErr } = await fetchInvoiceByNumber(String(invoiceNumberFromReceipt));
        if (!invNumErr && invByNum) {
          receiptCopy.invoices = normalizeInv(invByNum);
          (receiptCopy.invoices as any).otherFee = (receiptCopy.invoices as any).otherFee ?? (receiptCopy.invoices as any).other_fee ?? 0;
          console.debug("ClientReceipts.openReceipt: fetched invoice by number", invoiceNumberFromReceipt, receiptCopy.invoices);
        }
      } catch (e) {
        console.error("openReceipt.fetchInvoiceByNumber", e);
      }
    }

    if (receiptCopy?.invoice_id) {
      try {
        const { data: inv, error: invErr } = await fetchInvoiceById(String(receiptCopy.invoice_id));
        if (!invErr && inv) {
          // ensure otherFee field exists (admin code expects either otherFee or other_fee)
          const norm = normalizeInv(inv);
          // keep both camelCase and snake_case to be safe
          (norm as any).otherFee = (norm as any).otherFee ?? (norm as any).other_fee ?? 0;
          receiptCopy.invoices = norm;
          console.debug("ClientReceipts.openReceipt: attached invoice", norm);
        }
      } catch (e) {
        console.error("openReceipt.fetchInvoiceById", e);
      }
    }
    setSelected(receiptCopy);
    try {
      if (receiptCopy?.invoice_id) {
        const { sum, error } = await sumPreviousPaid(String(receiptCopy.invoice_id), {
          id: receiptCopy.id,
          payment_date: receiptCopy.payment_date ?? null,
          created_at: receiptCopy.created_at ?? null,
        } as any);
        if (!error) setPreviousPaid(Number(sum ?? 0));
        else setPreviousPaid(0);
      } else {
        setPreviousPaid(0);
      }
    } catch (e) {
      console.error("openReceipt.sumPreviousPaid", e);
      setPreviousPaid(0);
    }
  };

  const downloadReceipt = async () => {
    if (!selected) return;
    try {
      const blob = await exportReceiptToPng(
        selected,
        client?.name ?? client?.full_name ?? "",
        client?.room ?? client?.room_number ?? "",
        client?.contact ?? "",
        client?.email ?? "",
        previousPaid
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${selected?.id ?? "unknown"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("exportReceipt failed", err);
      alert("Failed to export receipt image.");
    }
  };

  // Download directly for a given receipt (used from the list where `selected` isn't set yet)
  const downloadReceiptFor = async (r: any) => {
    if (!r) return;
    const receiptCopy = { ...(r || {}) } as any;
    // parse embedded invoice JSON if present
    if (typeof receiptCopy.invoices === "string") {
      try {
        receiptCopy.invoices = JSON.parse(receiptCopy.invoices);
      } catch (e) {
        // ignore
      }
    }

    const normalizeInv = (inv: any) => {
      if (!inv) return inv;
      const out: any = { ...(inv as any) };
      out.base_price = out.base_price ?? out.basePrice ?? out.base_price_amount ?? 0;
      out.extra_device_charge = out.extra_device_charge ?? out.extraDeviceCharge ?? 0;
      out.unregistered_overcharge = out.unregistered_overcharge ?? out.unregisteredOvercharge ?? 0;
      out.rebate = out.rebate ?? out.rebatePercent ?? out.rebate_amount ?? 0;
      out.other_fee = out.other_fee ?? out.otherFee ?? 0;
      out.deposit_applied = out.deposit_applied ?? out.depositApplied ?? 0;
      out.total_amount = out.total_amount ?? out.totalAmount ?? out.total ?? 0;
      out.amount_paid = out.amount_paid ?? out.amountPaid ?? 0;
      out.balance_due = out.balance_due ?? out.balanceDue ?? Math.max(0, (out.total_amount ?? 0) - (out.amount_paid ?? 0));
      return out;
    };

    // try to ensure we have invoice details
    if (receiptCopy?.invoice_id && !receiptCopy.invoices) {
      try {
        const { data: inv, error: invErr } = await fetchInvoiceById(String(receiptCopy.invoice_id));
        if (!invErr && inv) {
          receiptCopy.invoices = normalizeInv(inv);
        }
      } catch (e) {
        console.error("downloadReceiptFor.fetchInvoiceById", e);
      }
    }

    if (receiptCopy?.invoices) receiptCopy.invoices = normalizeInv(receiptCopy.invoices);

    let prev = 0;
    try {
      if (receiptCopy?.invoice_id) {
        const { sum, error } = await sumPreviousPaid(String(receiptCopy.invoice_id), {
          id: receiptCopy.id,
          payment_date: receiptCopy.payment_date ?? null,
          created_at: receiptCopy.created_at ?? null,
        } as any);
        if (!error) prev = Number(sum ?? 0);
      }
    } catch (e) {
      console.error("downloadReceiptFor.sumPreviousPaid", e);
    }

    try {
      const blob = await exportReceiptToPng(
        receiptCopy,
        client?.name ?? client?.full_name ?? "",
        client?.room ?? client?.room_number ?? "",
        client?.contact ?? "",
        client?.email ?? "",
        prev
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receiptCopy?.id ?? "unknown"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("exportReceipt failed", err);
      alert("Failed to export receipt image.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#28C76F]/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#28C76F]" />
            </div>
            <p className="text-[#A0A0A0] text-sm">Total Payments</p>
          </div>
          <p className="text-3xl font-bold text-white">₱{totalPaid.toLocaleString()}</p>
          <p className="text-[#A0A0A0] text-sm mt-2">
            {receipts.length} receipts
          </p>
        </div>
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <p className="text-[#A0A0A0] text-sm mb-2">Latest Payment</p>
          <p className="text-3xl font-bold text-[#F5C400]">
            {receipts.length > 0 ? new Date(receipts[0].payment_date).toLocaleDateString("en-US", { 
              month: "short", 
              day: "numeric",
              year: "numeric"
            }) : "-"}
          </p>
          <p className="text-[#A0A0A0] text-sm mt-2">
            {receipts.length > 0 ? receipts[0].payment_method : "-"}
          </p>
        </div>
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <p className="text-[#A0A0A0] text-sm mb-2">Payment Methods</p>
          <p className="text-3xl font-bold text-white">{paymentMethods.length}</p>
          <p className="text-[#A0A0A0] text-sm mt-2">
            {paymentMethods.slice(0, 2).join(", ")}
            {paymentMethods.length > 2 ? `, +${paymentMethods.length - 2}` : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0]" />
          <Input
            type="search"
            placeholder="Search by receipt, invoice number or period..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#161616] border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:border-[#F5C400]"
          />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-full md:w-48 bg-[#161616] border-[#2A2A2A] text-white">
            <SelectValue placeholder="All Methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="GCash">GCash</SelectItem>
            <SelectItem value="PayMaya">PayMaya</SelectItem>
            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
            <SelectItem value="Cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Receipt List */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="divide-y divide-[#2A2A2A]">
          {filteredReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className="p-6 hover:bg-[#161616] transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[#28C76F] font-semibold text-lg">
                      {receipt.id}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-[#28C76F]/10 text-[#28C76F] border-[#28C76F]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2" />
                      Paid
                    </span>
                  </div>
                  <div>
                    {/* Primary title shows receipt id; invoice shown in metadata below, so remove the secondary invoice line */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#A0A0A0]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Paid: {receipt.payment_date ? new Date(receipt.payment_date).toLocaleDateString("en-US", { 
                            month: "short", 
                            day: "numeric", 
                            year: "numeric" 
                          }) : "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>{receipt.payment_method ?? "-"}</span>
                      </div>
                      <div>
                        Invoice: <span className="font-mono text-[#F5C400]">{String(receipt.invoices?.invoice_number ?? receipt.invoice_number ?? invoiceLookup.get(String(receipt.invoice_id ?? ""))?.invoice_number ?? receipt.invoice_id ?? "-")}</span>
                      </div>
                    </div>
                  </div>
                </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold text-[#28C76F]">
                      ₱{receipt.amount.toLocaleString()}
                    </p>
                  </div>
                  {/* View button removed */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog removed */}

      {/* Results Info */}
      <div className="flex items-center justify-between text-[#A0A0A0] text-sm">
        <p>
          Showing {filteredReceipts.length} of {receipts.length} receipts
        </p>
      </div>
    </div>
  );
}