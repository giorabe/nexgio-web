import React from "react";
import type { InvoiceUI } from "@/app/modules/internet/admin/types/invoice.types";
import { formatDateMMDDYY } from "@/app/utils/formatDate";
import Logo from "@/assets/NexGio LOGO B.png";

/**
 * Single source of truth invoice template:
 * - White "paper" card
 * - Black background around the card (like your screenshot)
 * - No "form" look
 * - Works for screen view + PNG export (same exact layout)
 */

export function InvoiceTemplate(props: {
  invoice: InvoiceUI;
  clientName?: string;
  clientRoom?: string;
  clientContact?: string;
  clientEmail?: string;
}) {
  const { invoice, clientName, clientRoom, clientContact, clientEmail } = props;

  const money = (n: any) => {
    const v = Number(n ?? 0);
    return `₱${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const chargesSubtotal = Number((invoice.basePrice ?? 0) + (invoice.extraDeviceCharge ?? 0) + (invoice.unregisteredOvercharge ?? 0));

  // Backwards-compat: stored rebate may be either percent (0-100) or legacy peso amount (>100 likely an amount)
  let rebatePercent = Number(invoice.rebate ?? 0);
  let rebateAmount = 0;
  if (rebatePercent <= 100) {
    rebateAmount = Number(((chargesSubtotal * rebatePercent) / 100).toFixed(2));
  } else {
    // legacy stored as amount
    rebateAmount = Number(rebatePercent || 0);
    rebatePercent = chargesSubtotal > 0 ? Number(((rebateAmount / chargesSubtotal) * 100).toFixed(2)) : 0;
  }

  const depositDisplay = () => {
    const v = Number(invoice.depositApplied ?? 0);
    if (v > 0) return `-₱${v.toLocaleString()}`;
    return `₱${v.toLocaleString()}`;
  };

  return (
    <div
      // BLACK background around the invoice
      style={{
        background: "#0f0f0f",
        padding: 18,
        borderRadius: 12,
        width: "fit-content",
        maxWidth: "100%",
      }}
    >
      {/* WHITE invoice "paper" */}
      <div
        style={{
          background: "#ffffff",
          color: "#000000",
          borderRadius: 12,
          padding: 22,
          width: 640,
          maxWidth: "100%",
          boxSizing: "border-box",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: 'center' }}>
          {/* Logo */}
          <div>
            <img src={Logo} alt="NexGio Logo" style={{ height: 48, width: "auto", display: "block" }} />
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>NexGio Solutions</div>
            <div style={{ color: "#4B5563", fontSize: 14, marginTop: 2 }}>
              Invoice #{invoice.invoiceNumber || "-"}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
            marginTop: 14,
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          <div>
            <div>
              <span style={{ color: "#4B5563" }}>Invoice Date: </span>
              <span style={{ fontWeight: 600 }}>{formatDateMMDDYY(invoice.invoiceDate)}</span>
            </div>
            <div>
              <span style={{ color: "#4B5563" }}>Due Date: </span>
              <span style={{ fontWeight: 600 }}>{formatDateMMDDYY(invoice.dueDate)}</span>
            </div>
          </div>

          <div>
            <div>
              <span style={{ color: "#4B5563" }}>Client: </span>
              <span style={{ fontWeight: 600 }}>{clientName || "-"}</span>
            </div>
            <div>
              <span style={{ color: "#4B5563" }}>Room: </span>
              <span style={{ fontWeight: 600 }}>{clientRoom || "-"}</span>
            </div>
            <div>
              <span style={{ color: "#4B5563" }}>Contact: </span>
              <span style={{ fontWeight: 600 }}>{clientContact || "-"}</span>
            </div>
            <div>
              <span style={{ color: "#4B5563" }}>Email: </span>
              <span style={{ fontWeight: 600 }}>{clientEmail || "-"}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ marginTop: 16, borderTop: "1px solid #111827" }} />

        {/* Items */}
        <div style={{ marginTop: 16, fontSize: 16 }}>
          <Row label="Base Price" value={money(invoice.basePrice)} />
          <Row label="Extra Device Charge" value={money(invoice.extraDeviceCharge)} />
          <Row label="Unregistered Overcharge" value={money(invoice.unregisteredOvercharge)} />
          <Row label={`Rebate (${rebatePercent}%):`} value={`- ${money(rebateAmount)}`} />
          <Row label="Previous Balance" value={money(invoice.previousBalance)} />
          <Row label="Deposit Applied" value={depositDisplay()} />
        </div>

        {/* Divider */}
        <div style={{ marginTop: 14, borderTop: "1px solid #111827" }} />

        {/* Total */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#4B5563", fontSize: 14 }}>Total</div>
            <div style={{ fontWeight: 800, fontSize: 32, marginTop: 2 }}>
              {money(invoice.totalAmount)}
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <div style={{ color: "#111827", fontSize: 14 }}>
            Status: <span style={{ fontWeight: 700 }}>{invoice.paymentStatus || "pending"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
      <div>{props.label}</div>
      <div>{props.value}</div>
    </div>
  );
}

/**
 * Export using the SAME InvoiceTemplate (no separate HTML template).
 * This avoids mismatch: Invoice.tsx and InvoiceHistory.tsx will match 1:1.
 */
export async function exportInvoiceToPng(
  invoice: InvoiceUI,
  clientName: string,
  clientRoom: string,
  clientContact: string,
  clientEmail: string
): Promise<Blob> {
  const html2canvas = (await import("html2canvas")).default;
  const { createRoot } = await import("react-dom/client");

  // mount offscreen
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "800px";
  host.style.zIndex = "-1";
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(
    <InvoiceTemplate
      invoice={invoice}
      clientName={clientName}
      clientRoom={clientRoom}
      clientContact={clientContact}
      clientEmail={clientEmail}
    />
  );

  // wait a bit for fonts/layout
  await new Promise((r) => setTimeout(r, 50));

  const element = host.firstElementChild as HTMLElement | null;
  if (!element) {
    root.unmount();
    document.body.removeChild(host);
    throw new Error("Failed to render invoice for PNG export.");
  }

  const canvas = await html2canvas(element, {
    scale: 3,
    backgroundColor: null, // keep black background from template
    useCORS: true,
    scrollY: -window.scrollY,
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });

  root.unmount();
  document.body.removeChild(host);

  return blob;
}
