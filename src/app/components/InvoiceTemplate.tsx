import React from "react";
import type { InvoiceUI } from "@/app/modules/internet/admin/types/invoice.types";
import { formatDateMMDDYY } from "@/app/utils/formatDate";

type Props = {
  invoice: InvoiceUI;
  clientName: string;
  clientRoom: string;
  clientContact?: string;
  clientEmail?: string;
};

/**
 * Portrait invoice sheet (A4-ish width).
 * IMPORTANT: Keep this component "pure" (no dialogs/forms/inputs), so html2canvas export is stable.
 */
export default function InvoiceTemplate({
  invoice,
  clientName,
  clientRoom,
  clientContact = "",
  clientEmail = "",
}: Props) {
  const fmtMoney = (n: number) => `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-white text-black rounded-md">
      {/* Sheet container */}
      <div
        className="mx-auto"
        style={{
          width: 794, // portrait width (A4-ish at 96dpi)
          padding: 28,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-6 border-b pb-4">
          <div className="flex items-center gap-3">
            {/* Replace with your logo image if you want */}
            <div className="w-14 h-14 rounded bg-black text-white flex items-center justify-center font-bold">
              NG
            </div>
            <div>
              <div className="text-lg font-bold leading-tight">NexGio Solutions</div>
              <div className="text-sm text-gray-600">Where Connection Meets Creation</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-gray-500">Invoice</div>
            <div className="text-lg font-bold">{invoice.invoiceNumber}</div>
            <div className="text-sm text-gray-600">
              Billing Month: <span className="font-medium">{formatDateMMDDYY(invoice.billingMonth ? `${invoice.billingMonth}-01` : undefined)}</span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-6 pt-4 text-sm">
          <div className="space-y-1">
            <div className="text-gray-500 text-xs uppercase tracking-wide">Bill To</div>
            <div className="font-semibold">{clientName}</div>
            <div>Room: <span className="font-medium">{clientRoom}</span></div>
            {clientContact ? <div>Contact: <span className="font-medium">{clientContact}</span></div> : null}
            {clientEmail ? <div>Email: <span className="font-medium">{clientEmail}</span></div> : null}
          </div>

          <div className="space-y-1 text-right">
            <div>
              <span className="text-gray-600">Invoice Date:</span>{" "}
              <span className="font-medium">{formatDateMMDDYY(invoice.invoiceDate) }</span>
            </div>
            <div>
              <span className="text-gray-600">Due Date:</span>{" "}
              <span className="font-medium">{formatDateMMDDYY(invoice.dueDate)}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>{" "}
              <span className="font-semibold">{invoice.paymentStatus}</span>
            </div>
            {invoice.paymentMethod ? (
              <div>
                <span className="text-gray-600">Method:</span>{" "}
                <span className="font-medium">{invoice.paymentMethod}</span>
              </div>
            ) : null}
            {invoice.paymentDate ? (
              <div>
                <span className="text-gray-600">Payment Date:</span>{" "}
                <span className="font-medium">{formatDateMMDDYY(invoice.paymentDate)}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Items */}
        <div className="mt-5 border rounded">
          <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
            <div className="col-span-8">Description</div>
            <div className="col-span-4 text-right">Amount</div>
          </div>

          <div className="divide-y">
            <Row label="Base Price" value={fmtMoney(invoice.basePrice)} />
            <Row label="Extra Device Charge" value={fmtMoney(invoice.extraDeviceCharge)} />
            <Row label="Unregistered Overcharge" value={fmtMoney(invoice.unregisteredOvercharge)} />
            {/* Rebate: support percent (preferred) or legacy amount */}
            {(() => {
              const chargesSubtotal = Number((invoice.basePrice ?? 0) + (invoice.extraDeviceCharge ?? 0) + (invoice.unregisteredOvercharge ?? 0));
              let rebatePercent = Number(invoice.rebate ?? 0);
              let rebateAmount = 0;
              if (rebatePercent <= 100) {
                rebateAmount = Number(((chargesSubtotal * rebatePercent) / 100).toFixed(2));
              } else {
                rebateAmount = Number(rebatePercent || 0);
                rebatePercent = chargesSubtotal > 0 ? Number(((rebateAmount / chargesSubtotal) * 100).toFixed(2)) : 0;
              }
              return <Row label={`Rebate (${rebatePercent}%):`} value={`- ${fmtMoney(rebateAmount)}`} />;
            })()}
            <Row label="Previous Balance" value={fmtMoney(invoice.previousBalance)} />
            <Row label="Deposit Applied" value={invoice.depositApplied ? `- ${fmtMoney(invoice.depositApplied)}` : fmtMoney(0)} />
          </div>
        </div>

        {/* Total */}
        <div className="mt-5 flex justify-end">
          <div className="w-[320px] border rounded p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-lg font-bold">{fmtMoney(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-xs text-gray-500">
          Please settle on or before the due date. Thank you.
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-12 px-3 py-2 text-sm">
      <div className="col-span-8">{label}</div>
      <div className="col-span-4 text-right font-medium">{value}</div>
    </div>
  );
}
