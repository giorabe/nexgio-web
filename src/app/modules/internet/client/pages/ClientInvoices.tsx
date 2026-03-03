import { useState, useEffect } from "react";
import { Search, Download, Eye, CreditCard, Calendar } from "lucide-react";
import { Input } from "@/app/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/shared/ui/select";
import { Button } from "@/app/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/app/shared/ui/dialog";
import StatusBadge from "@/app/components/StatusBadge";
import { fetchInvoicesByClient } from "@/app/modules/internet/admin/services/invoices.service";
import { useClientPortal } from "../hooks/useClientPortal";
import { InvoiceTemplate, exportInvoiceToPng } from "@/app/components/exportInvoiceToPng";

interface Invoice {
  id: string;
  period: string;
  amount: number;
  amountPaid?: number;
  balance?: number;
  date?: string | null;
  dueDate?: string | null;
  status: "paid" | "pending" | "overdue";
  paymentMethod?: string;
}

type DbInvoiceRow = any;

function formatBillingMonth(billingMonth?: string | null, invoiceDate?: string | null) {
  if (billingMonth) {
    const d = new Date(billingMonth);
    if (!isNaN(d.getTime())) return d.toLocaleString("en-US", { month: "long", year: "numeric" });
  }
  if (invoiceDate) {
    const d = new Date(invoiceDate);
    if (!isNaN(d.getTime())) return d.toLocaleString("en-US", { month: "long", year: "numeric" });
  }
  return "-";
}

function isOverdue(row: DbInvoiceRow) {
  const status = (row.payment_status ?? row.paymentStatus ?? "pending") as string;
  const due = row.due_date ?? row.dueDate ?? null;
  if (status === "paid") return false;
  if (!due) return false;
  const dueDate = new Date(due);
  if (isNaN(dueDate.getTime())) return false;
  const today = new Date();
  return dueDate.setHours(0,0,0,0) < today.setHours(0,0,0,0);
}

function mapRowToListItem(row: DbInvoiceRow): Invoice {
  const id = row.invoice_number ?? row.id ?? "";
  const period = formatBillingMonth(row.billing_month, row.invoice_date);
  const amount = Number(row.total_amount ?? row.totalAmount ?? row.amount ?? 0);
  const amountPaid = Number((row.amount_paid ?? row.amountPaid ?? 0) || 0);
  const balance = Math.max(0, amount - amountPaid);
  const date = row.invoice_date ?? row.date ?? null;
  const dueDate = row.due_date ?? row.dueDate ?? null;
  let status = (row.payment_status ?? row.paymentStatus ?? "pending") as string;
  // determine paid/overdue based on computed balance and due date
  if (balance <= 0) status = "paid";
  else if (status !== "paid" && isOverdue(row)) status = "overdue";
  return {
    id,
    period,
    amount,
    amountPaid,
    balance,
    date,
    dueDate,
    status: status as any,
    paymentMethod: row.payment_method ?? row.paymentMethod,
  };
}

function mapRowToInvoiceUI(row: DbInvoiceRow) {
  const basePrice = Number(row.base_price ?? row.base_price_amount ?? 0);
  const extraDeviceCharge = Number(row.extra_device_charge ?? 0);
  const unregisteredOvercharge = Number(row.unregistered_overcharge ?? 0);
  const rebatePercent = Number(row.rebate_percent ?? row.rebate ?? 0) || 0;
  const rebateAmount = Number(row.rebate_amount ?? ((basePrice * rebatePercent) / 100)) || 0;
  const previousBalance = Number(row.previous_balance ?? 0);
  const depositApplied = Number(row.deposit_applied ?? 0);
  const totalAmount = Number(row.total_amount ?? row.totalAmount ?? 0);
  const otherFee = Number(row.other_fee ?? row.otherFee ?? 0);
  const amountPaid = Number(row.amount_paid ?? row.amountPaid ?? 0);
  const balanceDue = Number(row.balance_due ?? row.balanceDue ?? Math.max(0, totalAmount - amountPaid));

  return {
    invoiceNumber: row.invoice_number ?? row.id ?? "",
    billingMonth: row.billing_month ?? row.billingMonth,
    invoiceDate: row.invoice_date ?? row.invoiceDate,
    dueDate: row.due_date ?? row.dueDate,
    basePrice,
    extraDeviceCharge,
    unregisteredOvercharge,
    rebate: rebatePercent,
    previousBalance,
    otherFee,
    depositApplied,
    totalAmount,
    amountPaid,
    balanceDue,
    paymentStatus: row.payment_status ?? row.paymentStatus,
    paymentMethod: row.payment_method ?? row.paymentMethod,
    __raw: row,
  } as any;
}

export default function ClientInvoices() {
  const { client, invoices: portalInvoices, loading } = useClientPortal();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rawInvoices, setRawInvoices] = useState<DbInvoiceRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = invoices.reduce((sum, i) => sum + Number(i.amountPaid ?? 0), 0);
  const totalPaidCount = invoices.filter((i) => Number(i.amountPaid ?? 0) > 0).length;
  const totalPending = invoices
    .filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0);

  const handlePayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentDialog(true);
  };

  useEffect(() => {
    if (loading) return;

    // If portalInvoices is provided (even empty), use it. If it's null/undefined, fetch from service.
    // If the hook already provided invoices (array), use that mapping
    // Support both shapes: hook may return an array or a Postgrest response { data, error }
    const portalRows: any[] = Array.isArray(portalInvoices) ? portalInvoices : ((portalInvoices as any)?.data ?? []);
    console.debug("ClientInvoices: portalRows.length", portalRows.length, "clientId", client?.id);
    if (portalRows && portalRows.length > 0) {
      setRawInvoices(portalRows);
      setInvoices(portalRows.map(mapRowToListItem));
      return;
    }

    // Otherwise, attempt to fetch directly for this client (only if client id exists)
    if (client?.id) {
      (async () => {
        try {
          const res = await fetchInvoicesByClient(client.id);
          // support either Postgrest response ({ data, error }) or direct array
          const rows = (((res as any)?.data ?? (res as any)) ?? []) as any[];
          const err = (res as any)?.error ?? null;
          if (err) {
            console.error("Failed to fetch invoices:", err);
            alert("Failed to load invoices");
            return;
          }
          setRawInvoices(rows);
          setInvoices(rows.map(mapRowToListItem));
        } catch (err) {
          console.error("Failed to fetch invoices:", err);
          alert("Failed to load invoices");
        }
      })();
    }
  }, [loading, portalInvoices, client?.id]);

  // Helper to download a Blob as a file
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (listItem: Invoice) => {
    try {
      const raw = rawInvoices.find((r) => (r.invoice_number ?? r.id) === listItem.id);
      if (!raw) {
        alert("Invoice data not available for download.");
        return;
      }
      const invoiceUI = mapRowToInvoiceUI(raw);
      const blob = await exportInvoiceToPng(invoiceUI, client?.name, client?.room, client?.contact, client?.email);
      const filename = `Invoice-${invoiceUI.invoiceNumber || listItem.id}.png`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export invoice. Please try again.");
    }
  };

  const processPayment = () => {
    if (selectedPaymentMethod && selectedInvoice) {
      // Mock payment processing
      alert(`Payment of ₱${selectedInvoice.amount} via ${selectedPaymentMethod} is being processed!`);
      setShowPaymentDialog(false);
      setSelectedPaymentMethod("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <p className="text-[#A0A0A0] text-sm mb-2">Total Paid</p>
          <p className="text-3xl font-bold text-[#28C76F]">₱{totalPaid.toLocaleString()}</p>
          <p className="text-[#A0A0A0] text-sm mt-2">
            {invoices.filter((i) => i.status === "paid").length} invoices
          </p>
        </div>
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <p className="text-[#A0A0A0] text-sm mb-2">Pending Payment</p>
          <p className="text-3xl font-bold text-[#FF9F43]">₱{totalPending.toLocaleString()}</p>
          <p className="text-[#A0A0A0] text-sm mt-2">
            {invoices.filter((i) => i.status === "pending").length} invoices
          </p>
        </div>
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <p className="text-[#A0A0A0] text-sm mb-2">Overdue</p>
          <p className="text-3xl font-bold text-[#EA5455]">₱{totalOverdue.toLocaleString()}</p>
          <p className="text-[#A0A0A0] text-sm mt-2">
            {invoices.filter((i) => i.status === "overdue").length} invoices
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0]" />
          <Input
            type="search"
            placeholder="Search by invoice number or period..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#161616] border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:border-[#F5C400]"
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
      </div>

      {/* Invoice List */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="divide-y divide-[#2A2A2A]">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="p-6 hover:bg-[#161616] transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[#F5C400] font-semibold text-lg">
                      {invoice.id}
                    </span>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-lg mb-1">{invoice.period}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#A0A0A0]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Issued: {invoice.date ? new Date(invoice.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                        </span>
                      </div>
                      {invoice.paymentMethod && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span>{invoice.paymentMethod}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold text-white">
                      ₱{invoice.amount.toLocaleString()}
                    </p>
                    <div className="text-sm text-[#A0A0A0] mt-1">
                      <div>Paid: <span className="text-white font-semibold">₱{(invoice.amountPaid ?? 0).toLocaleString()}</span></div>
                      <div>Balance: <span className="text-white font-semibold">₱{(invoice.balance ?? invoice.amount).toLocaleString()}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </DialogTrigger>
                        <DialogContent className="bg-[#1E1E1E] border-[#2A2A2A] text-white max-w-4xl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl">Invoice Details</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            {/* Render the shared InvoiceTemplate so view matches exported PNG */}
                            {(() => {
                              const raw = rawInvoices.find((r) => (r.invoice_number ?? r.id) === invoice.id);
                              if (!raw) return <p className="text-sm text-[#A0A0A0]">Invoice data not available.</p>;
                              const invoiceUI = mapRowToInvoiceUI(raw);
                              return (
                                <div className="bg-[#0F0F0F] p-4 rounded">
                                  {/* Debug: show mapped otherFee for troubleshooting */}
                                  <div className="text-sm text-[#A0A0A0] mb-2">Mapped Other Fee: <span className="text-white">₱{(invoiceUI.otherFee ?? 0).toLocaleString()}</span></div>
                                  <InvoiceTemplate
                                    invoice={invoiceUI}
                                    clientName={client?.name}
                                    clientRoom={client?.room}
                                    clientContact={client?.contact}
                                    clientEmail={client?.email}
                                  />
                                  {console.debug("ClientInvoices: invoiceUI", invoiceUI)}
                                </div>
                              );
                            })()}
                          </div>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(invoice)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    {(invoice.status === "pending" || invoice.status === "overdue") && (
                      <Button 
                        size="sm" 
                        className="bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F]"
                        onClick={() => handlePayment(invoice)}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-[#1E1E1E] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Payment Options</DialogTitle>
            <DialogDescription className="text-sm text-[#A0A0A0]">
              Select a payment method to proceed with the payment.
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="p-4 bg-[#161616] rounded-lg">
                <p className="text-[#A0A0A0] text-sm mb-1">Amount to Pay</p>
                <p className="text-3xl font-bold text-[#F5C400]">
                  ₱{selectedInvoice.amount.toLocaleString()}
                </p>
                <p className="text-[#A0A0A0] text-sm mt-1">
                  Invoice: {selectedInvoice.id}
                </p>
              </div>

              <div className="space-y-3">
                <p className="font-semibold text-white">Select Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  {["GCash", "PayMaya", "Bank Transfer", "Cash"].map((method) => (
                    <button
                      key={method}
                      onClick={() => setSelectedPaymentMethod(method)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedPaymentMethod === method
                          ? "border-[#F5C400] bg-[#F5C400]/10"
                          : "border-[#2A2A2A] bg-[#161616] hover:border-[#F5C400]/50"
                      }`}
                    >
                      <CreditCard className="w-6 h-6 text-[#F5C400] mb-2" />
                      <p className="text-white font-medium">{method}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={processPayment}
                disabled={!selectedPaymentMethod}
                className="w-full h-12 bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F] font-semibold disabled:opacity-50"
              >
                Proceed to Payment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Results Info */}
      <div className="flex items-center justify-between text-[#A0A0A0] text-sm">
        <p>
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </p>
      </div>
    </div>
  );
}