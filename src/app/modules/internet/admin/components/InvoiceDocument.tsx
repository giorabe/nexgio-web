import React from "react";
import type { InvoiceUI } from "../types/invoice.types";
import { formatDateMMDDYY } from "@/app/utils/formatDate";
export function InvoiceDocumentHTML({ invoice }: { invoice: InvoiceUI }) {
  return (
    <div style={{ background: "#0F0F0F", color: "white", padding: 20, borderRadius: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 120, height: 48, border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center" }}>NexGio</div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700 }}>NexGio Solutions</div>
          <div>Invoice #{invoice.invoiceNumber}</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div>Invoice Date: {formatDateMMDDYY(invoice.invoiceDate)}</div>
          <div>Due Date: {formatDateMMDDYY(invoice.dueDate)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div>Client: {invoice.clientId}</div>
          <div>Room: {invoice.clientId}</div>
          <div>Email: {invoice.paymentMethod ?? ""}</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>Base Price</div>
          <div>₱{invoice.basePrice}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>Extra Device Charge</div>
          <div>₱{invoice.extraDeviceCharge}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>Unregistered Overcharge</div>
          <div>₱{invoice.unregisteredOvercharge}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>Rebate</div>
          <div>-₱{invoice.rebate}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>Previous Balance</div>
          <div>₱{invoice.previousBalance}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>Deposit Applied</div>
          <div>-₱{invoice.depositApplied}</div>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, color: "#F5C400" }}>Total: ₱{invoice.totalAmount}</div>
        <div>{invoice.paymentStatus}</div>
      </div>
    </div>
  );
}



export default InvoiceDocumentHTML;
