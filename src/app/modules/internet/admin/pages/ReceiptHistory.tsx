import { useEffect, useState } from "react";
import { Button } from "@/app/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/shared/ui/dialog";
import { formatDateMMDDYY } from "@/app/utils/formatDate";
import { listPaymentsAll, deletePayment, recomputeInvoiceFromPayments } from "@/app/modules/internet/admin/services/payments.service";
import ReceiptTemplate, { exportReceiptToPng } from "@/app/modules/internet/admin/components/ReceiptTemplate";

export default function ReceiptHistory() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [previousPaid, setPreviousPaid] = useState<number>(0);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await listPaymentsAll();
      if (res?.error) throw res.error;
      setReceipts(res?.data ?? []);
    } catch (e) {
      console.error("ReceiptHistory.load", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const openReceipt = async (r: any) => {
    setSelected(r);

    // compute previousPaid for this invoice/payment
    try {
      if (r?.invoice_id) {
        const { sum, error } = await (
          await import("@/app/modules/internet/admin/services/payments.service")
        ).sumPreviousPaid(String(r.invoice_id), {
          id: r.id,
          payment_date: r.payment_date ?? null,
          created_at: r.created_at ?? null,
        });

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

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm("Delete this payment?")) return;

    try {
      await deletePayment(String(selected.id));

      if (selected.invoice_id) {
        const rec: any = await recomputeInvoiceFromPayments(String(selected.invoice_id));
        if (rec?.error) throw rec.error;
      }

      await load();
      setSelected(null);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Failed to delete payment");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Receipt History</h2>
        <div>
          <Button onClick={load} variant="outline" disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#161616]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">Client</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">Invoice</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">Method</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#2A2A2A]">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-[#161616]">
                  <td className="px-6 py-4 text-white">{r.clients?.name ?? r.client_id}</td>
                  <td className="px-6 py-4 text-[#F5C400]">
                    {r.invoices?.invoice_number ?? "Advance/No Invoice"}
                  </td>
                  <td className="px-6 py-4 text-white">{r.payment_type}</td>
                  <td className="px-6 py-4 text-white">₱{Number(r.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-[#A0A0A0]">
                    {r.payment_date ? formatDateMMDDYY(r.payment_date) : "-"}
                  </td>
                  <td className="px-6 py-4 text-[#A0A0A0]">{r.payment_method ?? "-"}</td>
                  <td className="px-6 py-4">
                    <Button variant="outline" onClick={() => openReceipt(r)}>
                      View Receipt
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          className="
            bg-[#1E1E1E] border-[#2A2A2A] text-white
            w-[95vw] max-w-[980px]
            max-h-[92vh]
            overflow-hidden
          "
        >
          <DialogHeader>
            <DialogTitle>Receipt {selected?.invoices?.invoice_number ?? "(Advance)"}</DialogTitle>
          </DialogHeader>

          {/* Body scroll ONLY */}
          <div className="overflow-y-auto pr-1" style={{ maxHeight: "70vh" }}>
            {selected && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div
                    style={{
                      width: 720,
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
                    <ReceiptTemplate
                      receipt={selected}
                      clientName={selected?.clients?.name}
                      clientRoom={selected?.clients?.room}
                      clientContact={selected?.clients?.contact}
                      clientEmail={selected?.clients?.email}
                      previousPaid={previousPaid}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (!selected) return;
                  try {
                    const blob = await exportReceiptToPng(
                      selected,
                      selected?.clients?.name ?? "",
                      selected?.clients?.room ?? "",
                      selected?.clients?.contact ?? "",
                      selected?.clients?.email ?? "",
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
                }}
                className="bg-[#10B981] text-white"
              >
                Save as Image
              </Button>

              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>

              <Button variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
