import React from "react";
import Logo from "@/assets/NexGio LOGO B.png";
import { formatDateMMDDYY } from "@/app/utils/formatDate";

export default function ReceiptTemplate(props: {
  receipt: any;
  clientName?: string;
  clientRoom?: string;
  clientContact?: string;
  clientEmail?: string;
  previousPaid?: number;
}) {
  const { receipt, clientName, clientRoom, clientContact, clientEmail, previousPaid } = props;

  const money = (n: any) => {
    const v = Number(n ?? 0);
    return `₱${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const paymentDate = receipt?.payment_date ? formatDateMMDDYY(receipt.payment_date) : "-";
  const invoiceNumber = receipt?.invoices?.invoice_number ?? "Advance/No Invoice";
  const paymentType = receipt?.payment_type ?? "-";
  const paymentMethod = receipt?.payment_method ?? "-";
  const amountPaid = receipt?.amount ?? 0;
  const notes = receipt?.notes ?? "-";

  const totalAmount = Number(receipt?.invoices?.total_amount ?? 0);
  const amountPaidOnInvoice = Number(receipt?.invoices?.amount_paid ?? 0);
  const balanceDue = (typeof receipt?.invoices?.balance_due !== "undefined") ? Number(receipt.invoices.balance_due) : Math.max(totalAmount - amountPaidOnInvoice, 0);
  const paymentStatus = receipt?.invoices?.payment_status ?? "pending";

  // Invoice charge fields (display only - do not recompute)
  const invBasePrice = Number(receipt?.invoices?.base_price ?? 0);
  const invExtraDeviceCharge = Number(receipt?.invoices?.extra_device_charge ?? 0);
  const invUnregisteredOvercharge = Number(receipt?.invoices?.unregistered_overcharge ?? 0);
  const invRebate = Number(receipt?.invoices?.rebate ?? 0);
  const invPreviousBalance = Number(receipt?.invoices?.previous_balance ?? 0);
  const invDepositApplied = Number(receipt?.invoices?.deposit_applied ?? 0);
  const invTotalAmount = Number(receipt?.invoices?.total_amount ?? 0);

  return (
    <div
      style={{
        background: "#0f0f0f",
        padding: 18,
        borderRadius: 12,
        width: "fit-content",
        maxWidth: "100%",
      }}
    >
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: 'center' }}>
          <div>
            <img src={Logo} alt="NexGio Logo" style={{ height: 48, width: "auto", display: "block" }} />
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>NexGio Solutions</div>
            <div style={{ color: "#4B5563", fontSize: 14, marginTop: 2 }}>
              Receipt #{receipt?.id ?? "-"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 18 }}>
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

            <div>
              <div>
                <span style={{ color: "#4B5563" }}>Payment Date: </span>
                <span style={{ fontWeight: 600 }}>{paymentDate}</span>
              </div>
              <div>
                <span style={{ color: "#4B5563" }}>Payment Method: </span>
                <span style={{ fontWeight: 600 }}>{paymentMethod}</span>
              </div>
              <div>
                <span style={{ color: "#4B5563" }}>Payment Type: </span>
                <span style={{ fontWeight: 600 }}>{paymentType}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, borderTop: "1px solid #111827" }} />

        <div style={{ marginTop: 16, fontSize: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Breakdown</div>

          <div style={{ fontWeight: 600, marginBottom: 6 }}>Invoice Charges</div>
          <Row label="Base Price" value={money(invBasePrice)} />
          <Row label="Extra Device Charge" value={money(invExtraDeviceCharge)} />
          <Row label="Unregistered Overcharge" value={money(invUnregisteredOvercharge)} />
                  {(() => {
                    const chargesSubtotal = Number(invBasePrice + invExtraDeviceCharge + invUnregisteredOvercharge);
                    let rebatePercent = invRebate;
                    let rebateAmount = 0;
                    if (rebatePercent <= 100) {
                      rebateAmount = Number(((chargesSubtotal * rebatePercent) / 100).toFixed(2));
                    } else {
                      rebateAmount = rebatePercent;
                      rebatePercent = chargesSubtotal > 0 ? Number(((rebateAmount / chargesSubtotal) * 100).toFixed(2)) : 0;
                    }
                    return <Row label={`Rebate (${rebatePercent}%):`} value={`- ${money(rebateAmount)}`} />;
                  })()}
          <Row label="Previous Balance" value={money(invPreviousBalance)} />
          <Row label="Deposit Applied" value={money(invDepositApplied)} />
          <Row label="Total Amount" value={money(invTotalAmount)} />

          <div style={{ height: 8 }} />

          <div style={{ fontWeight: 600, marginBottom: 6 }}>Payment Details</div>
          <Row label="Invoice" value={invoiceNumber} />
          <Row label="Payment Type" value={paymentType} />
          <Row label="Previous Paid" value={money(previousPaid ?? 0)} />
          <Row label="Amount Paid" value={money(amountPaid)} />
          <Row label="Payment Date" value={paymentDate} />
          <Row label="Payment Method" value={paymentMethod} />
          <Row label="Remaining Balance" value={money(balanceDue)} />
          <Row label="Notes" value={notes} />
        </div>

        <div style={{ marginTop: 14, borderTop: "1px solid #111827" }} />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#4B5563", fontSize: 14 }}>Status</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginTop: 2 }}>{paymentStatus}</div>
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

export async function exportReceiptToPng(
  receipt: any,
  clientName: string,
  clientRoom: string,
  clientContact: string,
  clientEmail: string,
  previousPaid: number = 0
): Promise<Blob> {
  const html2canvas = (await import("html2canvas")).default;
  const { createRoot } = await import("react-dom/client");

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "720px";
  host.style.zIndex = "-1";
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(
    <ReceiptTemplate
      receipt={receipt}
      clientName={clientName}
      clientRoom={clientRoom}
      clientContact={clientContact}
      clientEmail={clientEmail}
      previousPaid={previousPaid}
    />
  );

  await new Promise((r) => setTimeout(r, 50));

  const element = host.firstElementChild as HTMLElement | null;
  if (!element) {
    root.unmount();
    document.body.removeChild(host);
    throw new Error("Failed to render receipt for PNG export.");
  }

  const canvas = await html2canvas(element, {
    scale: 3,
    backgroundColor: "#ffffff",
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
