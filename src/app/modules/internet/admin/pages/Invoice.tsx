import type React from "react";
import { useEffect, useMemo, useState } from "react";

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

import StatusBadge from "@/app/components/StatusBadge";

import { FileText, Download } from "lucide-react";
import { useClients } from "@/app/modules/internet/admin/hooks/useClients";
import { useInvoices } from "@/app/modules/internet/admin/hooks/useInvoices";
import { updateClient } from "@/app/modules/internet/admin/services/clients.service";
import { useTiers } from "@/app/modules/internet/admin/hooks/useTiers";

import { InvoiceTemplate, exportInvoiceToPng } from "@/app/modules/internet/admin/components/InvoiceTemplate";
import { formatMMDDYY } from "@/app/shared/utils/dateFormat";
import type { InvoiceUI, InvoiceRow } from "@/app/modules/internet/admin/types/invoice.types";
import { computeClientPreviousBalance } from "@/app/modules/internet/admin/services/invoices.service";
import { updateInvoice } from "@/app/modules/internet/admin/services/invoices.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/shared/ui/dialog";
import { toast } from "sonner";

export default function Invoice() {
  const { clients, reload: reloadClients } = useClients();
  const { createInvoiceForClient, loading: creating } = useInvoices();
  const { tiers } = useTiers();

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [invoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  const [unregisteredOverchargeInput, setUnregisteredOverchargeInput] = useState<string>("0");
  const [rebateInput, setRebateInput] = useState<string>("0");
  const [overridePreviousBalanceInput, setOverridePreviousBalanceInput] = useState<string | null>(null);
  const [autoPreviousBalance, setAutoPreviousBalance] = useState<number>(0);
  const [hasDeposit, setHasDeposit] = useState(false);
  const [useDepositAsPayment, setUseDepositAsPayment] = useState(false);
  const [depositAppliedInput, setDepositAppliedInput] = useState<string>("0");

  const [savedInvoice, setSavedInvoice] = useState<InvoiceRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editPatch, setEditPatch] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? null,
    [selectedClientId, clients]
  );

  useEffect(() => {
    if (!selectedClient) return;
    setDueDate(selectedClient.dueDate);
    setOverridePreviousBalanceInput(null);

    // reset auto previous balance while we fetch
    setAutoPreviousBalance(0);
    let mounted = true;
    void computeClientPreviousBalance(selectedClient.id)
      .then((v) => {
        if (mounted) setAutoPreviousBalance(v);
      })
      .catch(() => {
        if (mounted) setAutoPreviousBalance(0);
      });

    const clientHasDeposit = (selectedClient.depositAmount ?? 0) > 0;
    setHasDeposit(clientHasDeposit);
    setUseDepositAsPayment(false);
    setDepositAppliedInput("0");

    setUnregisteredOverchargeInput("0");
    setRebateInput("0");

    // Auto-generate invoice number when client selected, only if empty
    if (!invoiceNumber) {
      generateInvoiceNumber();
    }
  }, [selectedClientId, selectedClient]);

  const computed = (() => {
    const tier = tiers.find((t) => t.id === selectedClient?.tierId);

    const basePrice = tier?.price ?? 0;

    const clientDevices = Number(selectedClient?.devices ?? 0);
    const tierLimit = Number(tier?.deviceLimit ?? 0);

    const registeredExtraDevices = Math.max(0, clientDevices - tierLimit);
    const extraDeviceCharge = registeredExtraDevices * 60;

    return {
      basePrice,
      registeredExtraDevices,
      extraDeviceCharge,
      previousBalance: autoPreviousBalance,
      depositBalance: selectedClient?.depositAmount ?? 0,
    };
  })();

  const previousBalance = overridePreviousBalanceInput !== null ? Number(overridePreviousBalanceInput || 0) : computed.previousBalance;
  const depositBalance = hasDeposit ? computed.depositBalance : 0;

  const unregisteredOvercharge = Number(unregisteredOverchargeInput || 0);

  // parse rebate input into percent 0-100 per rules
  function parseRebatePercent(input: string): number {
    if (!input) return 0;
    const raw = String(input).trim();
    if (raw === "") return 0;
    // remove percent sign if present
    const cleaned = raw.replace(/%/g, "").trim();
    const n = Number(cleaned);
    if (Number.isNaN(n)) return 0;
    // if user provided decimal like 0.1, treat as 0.1% (explicit decimal preserved)
    // otherwise treat numeric as whole percent (e.g., 10 -> 10%)
    const percent = n;
    // clamp 0..100
    if (percent < 0) return 0;
    if (percent > 100) return 100;
    return percent;
  }

  const rebatePercent = parseRebatePercent(rebateInput || "0");

  // charges subtotal (base + extra + unregistered) - rebate applies only to charges subtotal
  const chargesSubtotal = computed.basePrice + computed.extraDeviceCharge + unregisteredOvercharge;
  const rebateAmount = Number(((chargesSubtotal * rebatePercent) / 100).toFixed(2));

  const totalBeforeDeposit = chargesSubtotal - rebateAmount + previousBalance;

  useEffect(() => {
    if (!selectedClient) return;
    if (!useDepositAsPayment) {
      setDepositAppliedInput("0");
      return;
    }
    const auto = Math.min(depositBalance, totalBeforeDeposit);
    setDepositAppliedInput(String(auto));
  }, [useDepositAsPayment, depositBalance, totalBeforeDeposit, selectedClient]);

  const depositApplied = useDepositAsPayment
    ? Math.min(Math.max(0, Number(depositAppliedInput || 0)), depositBalance)
    : 0;

  const subtotal = Math.max(0, totalBeforeDeposit - depositApplied);

  const generateInvoiceNumber = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const num = `NGS-${y}${m}${day}-${suffix}`;
    setInvoiceNumber(num);
    return num;
  };

  const handleSave = async () => {
    if (!selectedClient) return;
    if (saving) return;
    setMessage(null);
    setSaving(true);
    const invoiceNum = invoiceNumber || generateInvoiceNumber();
    try {
      const res = await createInvoiceForClient(selectedClient, {
        invoiceNumber: invoiceNum,
        unregisteredOvercharge,
        // store percent (0-100)
        rebate: rebatePercent,
        previousBalance,
        depositApplied,
        paymentMethod: null,
      });

      if (res.ok) {
        // show toast success
        toast.success("Success", {
          description: "Invoice created successfully.",
          duration: 3000,
          position: "top-right",
        });

        // Deduct deposit from client if applied
        if (depositApplied > 0) {
          try {
            const oldDeposit = Number(selectedClient.depositAmount ?? 0);
            const newDeposit = Math.max(oldDeposit - depositApplied, 0);
            await updateClient(selectedClient.id, { deposit_amount: newDeposit } as any);
          } catch (e) {
            console.error("Failed to update client deposit:", e);
          }
        }

        // Refresh clients and save created invoice
        void reloadClients();
        setSavedInvoice(res.invoice ?? null);
        setInvoiceNumber("");
      } else {
        setMessage(`Failed: ${res.error?.message ?? "unknown"}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = () => {
    if (!savedInvoice) return;
    setEditPatch({
      invoice_number: savedInvoice.invoice_number,
      invoice_date: savedInvoice.invoice_date,
      due_date: savedInvoice.due_date,
      base_price: savedInvoice.base_price,
      extra_device_charge: savedInvoice.extra_device_charge,
      unregistered_overcharge: savedInvoice.unregistered_overcharge,
      rebate: savedInvoice.rebate,
      previous_balance: savedInvoice.previous_balance,
      deposit_applied: savedInvoice.deposit_applied,
      total_amount: savedInvoice.total_amount,
      payment_status: savedInvoice.payment_status,
      payment_date: savedInvoice.payment_date,
      payment_method: savedInvoice.payment_method,
      billing_month: savedInvoice.billing_month,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!savedInvoice) return;
    try {
      // ensure rebate is numeric value (percent) before sending
      const patchToSend = { ...editPatch } as any;
      if (patchToSend.rebate !== undefined) {
        patchToSend.rebate = Number(String(patchToSend.rebate || 0));
      }
      const res: any = await updateInvoice(String(savedInvoice.id), patchToSend);
      if (res?.error) {
        setMessage(`Update failed: ${res.error?.message ?? "unknown"}`);
        return;
      }
      setSavedInvoice(res.data ?? savedInvoice);
      setEditOpen(false);
      setMessage("Invoice updated");
    } catch (e: any) {
      setMessage(`Update failed: ${e?.message ?? String(e)}`);
    }
  };

  function buildInvoiceUI(): InvoiceUI | null {
    if (!selectedClient) return null;

    const tier = tiers.find((t) => t.id === selectedClient.tierId);
    const basePrice = tier?.price ?? 0;

    const clientDevices = Number(selectedClient.devices ?? 0);
    const tierLimit = Number(tier?.deviceLimit ?? 0);
    const extraDevices = Math.max(0, clientDevices - tierLimit);
    const extraDeviceCharge = extraDevices * 60;

    // charges subtotal before rebate
    const chargesSubtotalUI = basePrice + extraDeviceCharge + unregisteredOvercharge;
    // determine rebate percent for UI from current input
    const rebatePercentUI = parseRebatePercent(rebateInput || "0");
    const rebateAmountUI = Number(((chargesSubtotalUI * rebatePercentUI) / 100).toFixed(2));

    const totalAmount = Math.max(0, Number((chargesSubtotalUI - rebateAmountUI + previousBalance - depositApplied).toFixed(2)));

    return {
      id: String(savedInvoice?.id ?? ""),
      clientId: selectedClient.id,
      invoiceNumber: invoiceNumber || savedInvoice?.invoice_number || "",
      billingMonth: savedInvoice?.billing_month ?? new Date().toISOString().slice(0, 7),
      invoiceDate,
      dueDate,
      basePrice,
      extraDeviceCharge,
      unregisteredOvercharge,
      // store/display rebate as percent (0-100)
      rebate: rebatePercentUI,
      previousBalance,
      depositApplied,
      totalAmount,
      paymentStatus: (savedInvoice?.payment_status as any) ?? "pending",
      paymentDate: savedInvoice?.payment_date ?? null,
      paymentMethod: savedInvoice?.payment_method ?? null,
      createdAt: savedInvoice?.created_at ?? undefined,
      updatedAt: savedInvoice?.updated_at ?? undefined,
    };
  }

  // mark-as-paid removed from this page; payments must be done via Payments Entry

  const handleExportPng = async () => {
    const invoiceUI = buildInvoiceUI();
    if (!invoiceUI || !selectedClient) return;

    try {
      setMessage("Generating PNG...");
      const pngBlob = await exportInvoiceToPng(
        invoiceUI,
        selectedClient.name,
        selectedClient.room,
        selectedClient.contact ?? "-",
        selectedClient.email ?? "-"
      );

      const url = URL.createObjectURL(pngBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceUI.invoiceNumber || "draft"}.png`;
      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("PNG exported successfully");
    } catch (err) {
      setMessage(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-1">Invoice Generation</h2>
          <p className="text-[#A0A0A0]">Create and manage client invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#F5C400]" /> Client Information
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Select Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger aria-label="Select client" className="bg-[#161616] border-[#2A2A2A] text-white">
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} - {c.room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2A2A2A]">
                <div>
                  <p className="text-[#A0A0A0] text-sm mb-1">Room Number</p>
                  <p className="text-white font-medium">{selectedClient?.room ?? "-"}</p>
                </div>
                <div>
                  <p className="text-[#A0A0A0] text-sm mb-1">Client Name</p>
                  <p className="text-white font-medium">{selectedClient?.name ?? "-"}</p>
                </div>
                <div>
                  <p className="text-[#A0A0A0] text-sm mb-1">Contact</p>
                  <p className="text-white font-medium">{selectedClient?.contact ?? "-"}</p>
                </div>
                <div>
                  <p className="text-[#A0A0A0] text-sm mb-1">Email</p>
                  <p className="text-white font-medium">{selectedClient?.email ?? "-"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Invoice Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Invoice Number</Label>
                <div className="flex gap-2">
                  <Input value={invoiceNumber} readOnly placeholder="Auto-generated invoice #" className="bg-[#161616] border-[#2A2A2A] text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Invoice Date</Label>
                  <div>
                    <Input type="date" value={invoiceDate} readOnly className="hidden" />
                    <p className="text-white font-medium">{formatMMDDYY(invoiceDate)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Due Date</Label>
                    <div>
                      <Input type="date" value={dueDate} readOnly className="hidden" />
                      <p className="text-white font-medium">{formatMMDDYY(dueDate)}</p>
                    </div>
                  </div>
              </div>

              <div className="pt-2">
                <StatusBadge status="pending">Pending Payment</StatusBadge>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSave}
              className="flex-1 bg-[#F5C400] text-black hover:opacity-90"
              disabled={!selectedClient || creating || saving}
              type="button"
            >
              Save Invoice
            </Button>

            <Button
              onClick={handleExportPng}
              variant="outline"
              className="flex-1 border-[#2A2A2A] text-white"
              disabled={!selectedClient}
              type="button"
            >
              <Download className="mr-2" /> Save as Image
            </Button>
          </div>

          {message && <p className="text-sm text-[#A0A0A0]">{message}</p>}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Charges Breakdown</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2"><span className="text-[#A0A0A0]">Base Price</span><span className="text-white">₱{computed.basePrice}</span></div>
              <div className="flex items-center justify-between py-2"><span className="text-[#A0A0A0]">Extra Devices ({computed.registeredExtraDevices})</span><span className="text-white">₱{computed.extraDeviceCharge}</span></div>

              <div className="flex items-center justify-between py-2 gap-3">
                <span className="text-[#A0A0A0]">Unregistered Overcharge</span>
                <div className="flex items-center gap-2"><span className="text-[#A0A0A0]">₱</span>
                  <Input id="unregisteredOvercharge" type="number" inputMode="numeric" value={unregisteredOverchargeInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnregisteredOverchargeInput(e.target.value)} className="w-32 bg-[#161616] border-[#2A2A2A] text-white text-right" disabled={!selectedClient} />
                </div>
              </div>

              <div className="flex flex-col gap-1 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#A0A0A0]">Rebate (%)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#A0A0A0]">%</span>
                    <Input id="rebate" type="text" inputMode="decimal" value={rebateInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRebateInput(e.target.value)} className="w-32 bg-[#161616] border-[#2A2A2A] text-white text-right" disabled={!selectedClient} />
                  </div>
                </div>
                <p className="text-xs text-[#A0A0A0]">Example: 10 = 10%</p>
              </div>

              <div className="flex items-center justify-between py-2 gap-3">
                <span className="text-[#A0A0A0]">Rebate ({rebatePercent}%):</span>
                <span className="text-white">-₱{rebateAmount.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between py-2 gap-3">
                <span className="text-[#A0A0A0]">Previous Balance</span>
                <div className="flex items-center gap-2"><span className="text-[#A0A0A0]">₱</span>
                  <Input type="number" inputMode="numeric" value={overridePreviousBalanceInput !== null ? overridePreviousBalanceInput : String(previousBalance)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOverridePreviousBalanceInput(e.target.value)} className="w-32 bg-[#161616] border-[#2A2A2A] text-white text-right" disabled={!selectedClient} />
                </div>
              </div>

              <div className="border-t border-[#2A2A2A] pt-4 mt-2 space-y-3">
                <div className="flex items-center justify-between"><span className="text-[#A0A0A0]">Deposit</span>
                  <div className="flex items-center gap-2">
                    <input id="hasDeposit" aria-label="Has deposit" type="checkbox" checked={hasDeposit} onChange={(e) => { setHasDeposit(e.target.checked); setUseDepositAsPayment(false); setDepositAppliedInput("0"); }} disabled={!selectedClient} />
                    <Label htmlFor="hasDeposit" className="text-white cursor-pointer">Has deposit</Label>
                  </div>
                </div>

                {hasDeposit && (
                  <>
                    <div className="flex items-center justify-between"><span className="text-[#A0A0A0]">Deposit Balance</span><span className="text-white">₱{depositBalance}</span></div>
                    <div className="flex items-center justify-between"><Label htmlFor="useDepositAsPayment" className="text-[#A0A0A0] cursor-pointer">Use deposit as payment</Label>
                      <input id="useDepositAsPayment" aria-label="Use deposit as payment" type="checkbox" checked={useDepositAsPayment} onChange={(e) => setUseDepositAsPayment(e.target.checked)} disabled={!selectedClient} />
                    </div>
                    {useDepositAsPayment && (
                      <div className="flex items-center justify-between gap-3"><span className="text-[#A0A0A0]">Deposit Applied</span>
                        <div className="flex items-center gap-2"><span className="text-[#A0A0A0]">₱</span>
                          <Input type="number" inputMode="numeric" value={depositAppliedInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositAppliedInput(e.target.value)} className="w-32 bg-[#161616] border-[#2A2A2A] text-white text-right" disabled={!selectedClient} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border-t-2 border-[#F5C400] pt-4 mt-4">
                <div className="flex items-center justify-between"><span className="text-lg font-semibold text-white">Total Amount</span><span className="text-3xl font-bold text-[#F5C400]">₱{subtotal}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Edit Invoice Dialog */}
      {/* (success toast used instead of dialog) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#1E1E1E] border-[#2A2A2A] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 p-2">
            <div>
              <Label className="text-white">Invoice Number</Label>
              <Input value={editPatch.invoice_number ?? ""} onChange={(e) => setEditPatch((s:any)=>({...s, invoice_number: e.target.value}))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white">Invoice Date</Label>
                <Input type="date" value={editPatch.invoice_date ?? ""} onChange={(e) => setEditPatch((s:any)=>({...s, invoice_date: e.target.value}))} />
              </div>
              <div>
                <Label className="text-white">Due Date</Label>
                <Input type="date" value={editPatch.due_date ?? ""} onChange={(e) => setEditPatch((s:any)=>({...s, due_date: e.target.value}))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white">Base Price</Label>
                <Input type="number" value={String(editPatch.base_price ?? 0)} onChange={(e) => setEditPatch((s:any)=>({...s, base_price: Number(e.target.value)}))} />
              </div>
              <div>
                <Label className="text-white">Unregistered Overcharge</Label>
                <Input type="number" value={String(editPatch.unregistered_overcharge ?? 0)} onChange={(e) => setEditPatch((s:any)=>({...s, unregistered_overcharge: Number(e.target.value)}))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white">Rebate (%)</Label>
                <Input type="text" inputMode="decimal" value={String(editPatch.rebate ?? 0)} onChange={(e) => setEditPatch((s:any)=>({...s, rebate: e.target.value}))} />
              </div>
              <div>
                <Label className="text-white">Previous Balance</Label>
                <Input type="number" value={String(editPatch.previous_balance ?? 0)} onChange={(e) => setEditPatch((s:any)=>({...s, previous_balance: Number(e.target.value)}))} />
              </div>
            </div>

            <div>
              <Label className="text-white">Deposit Applied</Label>
              <Input type="number" value={String(editPatch.deposit_applied ?? 0)} onChange={(e) => setEditPatch((s:any)=>({...s, deposit_applied: Number(e.target.value)}))} />
            </div>

            <div>
              <Label className="text-white">Total Amount</Label>
              <Input type="number" value={String(editPatch.total_amount ?? 0)} onChange={(e) => setEditPatch((s:any)=>({...s, total_amount: Number(e.target.value)}))} />
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} className="bg-[#F5C400] text-black">Save</Button>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
