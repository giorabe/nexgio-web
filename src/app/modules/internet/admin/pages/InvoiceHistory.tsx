import { useRef, useEffect, useState } from "react";
import type React from "react";
import type { InvoiceRowWithClient, InvoiceUI } from "@/app/modules/internet/admin/types/invoice.types";

import { InvoiceTemplate } from "@/app/modules/internet/admin/components/InvoiceTemplate";
import { formatDateMMDDYY } from "@/app/utils/formatDate";

import { Button } from "@/app/shared/ui/button";
import { listRecentInvoices } from "@/app/modules/internet/admin/hooks/useInvoices";
import { deletePaymentsByInvoice } from "@/app/modules/internet/admin/services/payments.service";
import { deleteInvoice } from "@/app/modules/internet/admin/services/invoices.service";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/shared/ui/dialog";

import { Input } from "@/app/shared/ui/input";
import { Label } from "@/app/shared/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/shared/ui/select";

import StatusBadge from "@/app/components/StatusBadge";

import { Search, Calendar, Eye, Download } from "lucide-react";

interface Payment {
  id: number;
  clientName: string;
  clientRoom: string;
  clientContact: string;
  clientEmail: string;
  invoiceNumber: string;
  invoiceId?: string;
  amount: number;
  amountPaid: number;
  balance: number;
  date: string;
  dueDate: string;
  method: string;
  status: "paid" | "pending" | "overdue";
  details: {
    basePrice: number;
    extraDeviceCharge: number;
    unregisteredOvercharge: number;
    rebate: number;
    previousBalance: number;
    depositApplied: number;
    total: number;
  };
}

const mockPayments: Payment[] = [];

export default function InvoiceHistory() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog + Selection State
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);

  // (payments/receipts removed from this view — use Receipt History page)

  // Invoice Preview Reference
  const invoiceRef = useRef<HTMLDivElement>(null);

  // reload helper
  const reloadInvoices = async () => {
    try {
      const rows = await listRecentInvoices(100);
      console.log("[INV-HISTORY] fetched invoices", { count: (rows || []).length, sample: (rows || [])[0] });
      const mapped: Payment[] = (rows || []).map((r: InvoiceRowWithClient, idx: number) => {
        const total = Number((r as any).total_amount ?? 0);
        const paid = (r as any).amount_paid !== null && (r as any).amount_paid !== undefined
          ? Number((r as any).amount_paid)
          : Math.max(0, total - Number((r as any).balance_due ?? total));
        const balance = Number((r as any).balance_due ?? (total - paid));

        return {
          id: idx + 1,
          clientName: r.clients?.name ?? (r as any).client_name ?? String(r.client_id ?? "-"),
          clientRoom: r.clients?.room ?? (r as any).client_room ?? "-",
          clientContact: r.clients?.contact ?? (r as any).client_contact ?? "-",
          clientEmail: r.clients?.email ?? (r as any).client_email ?? "-",
          invoiceNumber: (r as any).invoice_number ?? String((r as any).id ?? ""),
          invoiceId: String((r as any).invoice_id ?? (r as any).id ?? ""),
          amount: total,
          amountPaid: paid,
          balance: balance,
          date: (r as any).invoice_date ?? "",
          dueDate: (r as any).due_date ?? "",
          method: (r as any).payment_method ?? "",
          // If balance_due <= 0 prefer 'paid' status regardless of stored payment_status
          status: (Number((r as any).balance_due ?? 0) <= 0) ? "paid" : (((r as any).payment_status as any) ?? "pending"),
          details: {
            basePrice: Number((r as any).base_price ?? 0),
            extraDeviceCharge: Number((r as any).extra_device_charge ?? 0),
            unregisteredOvercharge: Number((r as any).unregistered_overcharge ?? 0),
            rebate: Number((r as any).rebate ?? 0),
            previousBalance: Number((r as any).previous_balance ?? 0),
            depositApplied: Number((r as any).deposit_applied ?? 0),
            total: total,
          },
        };
      });
      setPayments(mapped);
    } catch (e) {
      console.error("Failed to reload invoices", e);
    }
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (!mounted) return;
      await reloadInvoices();
    })();
    const onUpdated = () => void reloadInvoices();
    window.addEventListener("invoices:updated", onUpdated as any);

    return () => {
      mounted = false;
      window.removeEventListener("invoices:updated", onUpdated as any);
    };
  }, []);

  // Convert Payment -> InvoiceUI for InvoiceTemplate
  function paymentToInvoiceUI(payment: Payment): InvoiceUI {
    return {
      id: String(payment.invoiceId ?? payment.id),
      clientId: payment.clientName,
      invoiceNumber: payment.invoiceNumber,
      billingMonth: payment.date?.slice(0, 7) ?? new Date().toISOString().slice(0, 7),
      invoiceDate: payment.date,
      dueDate: payment.dueDate,
      basePrice: payment.details.basePrice,
      extraDeviceCharge: payment.details.extraDeviceCharge,
      unregisteredOvercharge: payment.details.unregisteredOvercharge,
      rebate: payment.details.rebate,
      previousBalance: payment.details.previousBalance,
      depositApplied: payment.details.depositApplied,
      totalAmount: payment.details.total,
      paymentStatus: payment.status,
      paymentDate: payment.date,
      paymentMethod: payment.method,
    } as any;
  }

  // Delete handler
  const handleDeleteInvoice = async () => {
    if (!selectedInvoice?.invoiceId) return;
    if (!confirm("Delete this invoice?")) return;

    try {
      const res = await deleteInvoice(String(selectedInvoice.invoiceId));
      if ((res as any)?.error) {
        alert("Failed to delete invoice");
        return;
      }
      // Payments should be removed by DB cascade (ON DELETE CASCADE). Do not perform manual deletion here.
      setViewOpen(false);
      setSelectedInvoice(null);
      await reloadInvoices();
    } catch (e) {
      console.error(e);
      alert("Failed to delete invoice");
    }
  };

  // Actions
  const openInvoice = (payment: Payment) => {
    setSelectedInvoice(payment);
    setViewOpen(true);
  };

  const openPaymentHistory = async (invoiceId?: string) => {
    // payment history removed from this page — open Receipt History instead
    if (!invoiceId) return;
    window.location.href = `/dashboard/receipts`;
  };

  

  // ✅ FIXED PNG Export (portrait, no half-cut)
  const handleSaveImage = async () => {
    if (!invoiceRef.current || !selectedInvoice) return;

    try {
      const html2canvas = (await import("html2canvas")).default;

      // clone the invoice preview only (not the dialog)
      const clone = invoiceRef.current.cloneNode(true) as HTMLElement;

      clone.style.position = "fixed";
      clone.style.left = "-99999px";
      clone.style.top = "0";
      clone.style.width = "720px"; // portrait-friendly width that fits dialogs better
      clone.style.maxWidth = "720px";
      clone.style.background = "#ffffff";
      clone.style.padding = "0";
      clone.style.overflow = "hidden";
      clone.style.zIndex = "999999";

      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
      });

      document.body.removeChild(clone);

      const link = document.createElement("a");
      link.download = `${selectedInvoice.invoiceNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("PNG export failed:", error);
      alert("Failed to export image.");
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Total Paid should include partial payments (use invoice.amount_paid from DB)
  const totalPaid = filteredPayments.reduce((sum, p) => sum + Number(p.amountPaid ?? 0), 0);
  const totalPaidCount = filteredPayments.filter((p) => Number(p.amountPaid ?? 0) > 0).length;

  // Keep pending/overdue as previous behavior (they rely on status and/or amount)
  const totalPending = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments.filter((p) => p.status === "overdue").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <p className="text-[#A0A0A0] text-sm mb-2">Total Paid</p>
          <p className="text-3xl font-bold text-[#28C76F]">₱{totalPaid.toLocaleString()}</p>
          <p className="text-[#A0A0A0] text-sm mt-2">{totalPaidCount} transactions</p>
        </div>
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <p className="text-[#A0A0A0] text-sm mb-2">Pending</p>
          <p className="text-3xl font-bold text-[#FF9F43]">₱{totalPending.toLocaleString()}</p>
          <p className="text-[#A0A0A0] text-sm mt-2">{payments.filter((p) => p.status === "pending").length} transactions</p>
        </div>
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <p className="text-[#A0A0A0] text-sm mb-2">Overdue</p>
          <p className="text-3xl font-bold text-[#EA5455]">₱{totalOverdue.toLocaleString()}</p>
          <p className="text-[#A0A0A0] text-sm mt-2">{payments.filter((p) => p.status === "overdue").length} transactions</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
        <div className="relative w-full md:w-1/2">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]">
            <Search className="w-4 h-4" />
          </div>
          <Input
            aria-label="Search invoices"
            placeholder="Search by client or invoice"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#161616] border-[#2A2A2A] text-white placeholder:text-[#A0A0A0]"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48 bg-[#161616] border-[#2A2A2A] text-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        {/* Method filter removed (moved to receipts) */}
      </div>

      {/* Payment Table */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#161616]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">Client Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">Invoice Number</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">Paid</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">Balance</th>

                {/* ✅ CHANGED: Payment Date -> Due Date */}
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0] min-w-[160px]">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-[#A0A0A0]">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#2A2A2A]">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-[#161616] transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{payment.clientName}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-[#F5C400] text-sm">{payment.invoiceNumber}</span>
                  </td>
                  <td className="px-6 py-4 text-white font-semibold">₱{payment.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-white font-semibold">₱{payment.amountPaid.toLocaleString()}</td>
                  <td className="px-6 py-4 text-white font-semibold">₱{payment.balance.toLocaleString()}</td>

                  {/* ✅ Due Date display */}
                  <td className="px-6 py-4 text-[#A0A0A0] whitespace-nowrap min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {payment.dueDate ? formatDateMMDDYY(payment.dueDate) : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
                        onClick={() => openInvoice(payment)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Invoice
                      </Button>

                      
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* ✅ FIXED VIEW INVOICE DIALOG: portrait + responsive */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent
          className="
            bg-[#1E1E1E] border-[#2A2A2A] text-white
            w-[95vw] max-w-[980px]
            max-h-[92vh]
            overflow-hidden
          "
        >
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle className="text-white">
              Invoice Details{selectedInvoice ? ` - ${selectedInvoice.invoiceNumber}` : ""}
            </DialogTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const invId = String(selectedInvoice?.invoiceId ?? "");
                  if (invId) window.location.href = `/dashboard/invoice?invoice=${invId}`;
                }}
                className="border-[#2A2A2A] text-white"
              >
                Edit
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const invId = String(selectedInvoice?.invoiceId ?? "");
                  if (invId) window.location.href = `/dashboard/payments-entry?invoice=${invId}`;
                }}
                className="border-[#2A2A2A] text-white"
              >
                Record Payment
              </Button>
            </div>
          </DialogHeader>

          {/* Body scroll ONLY */}
          <div className="overflow-y-auto pr-1" style={{ maxHeight: "70vh" }}>
            {selectedInvoice && (
              <div className="space-y-4">
                {/* Shared InvoiceTemplate preview, fixed portrait size, scrollable if needed */}
                <div className="flex justify-center">
                  <div
                    ref={invoiceRef}
                    style={{
                      width: 1800,
                      height: "100%",
                      background: "#222",
                      borderRadius: 16,
                      boxShadow: "0 0 24px #0004",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "auto",
                      padding: 24,
                    }}
                  >
                    <InvoiceTemplate
                      invoice={paymentToInvoiceUI(selectedInvoice)}
                      clientName={selectedInvoice.clientName}
                      clientRoom={selectedInvoice.clientRoom}
                      clientContact={selectedInvoice.clientContact}
                      clientEmail={selectedInvoice.clientEmail}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveImage}
                  className="w-full border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
                  variant="outline"
                  type="button"
                >
                  <Download className="w-4 h-4 mr-2" /> Download as Image (PNG)
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteInvoice}>
              Delete Invoice
            </Button>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Info */}
      <div className="flex items-center justify-between text-[#A0A0A0] text-sm">
        <p>
          Showing {filteredPayments.length} of {payments.length} transactions
        </p>
        <p>
          Total: ₱{filteredPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
        </p>
      </div>

      {/* Payment History removed — use Receipt History page */}
    </div>
  );
}