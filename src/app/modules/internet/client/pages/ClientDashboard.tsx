import { Wifi, TrendingUp, Calendar, AlertCircle, CreditCard } from "lucide-react";
import { Button } from "@/app/shared/ui/button";
import StatusBadge from "@/app/components/StatusBadge";
import { useClientPortal } from "../hooks/useClientPortal";

export default function ClientDashboard() {
  const { client, invoices, payments, loading, error } = useClientPortal();

  console.log("CLIENT OBJECT:", client);

  const clientData = {
    name: client?.name ?? client?.room ?? "Client",
    accountId: client?.account_username ?? client?.id ?? "#unknown",
    status: client?.status ?? "active",

    tier: client?.tier_name ?? "Plan",
    speed: client?.tier_speed ?? "-",
    deviceLimit: Number(client?.tier_device_limit ?? 0),
    currentDevices: Number(client?.current_devices ?? client?.devices ?? 0),

    // Use total_unpaid for current balance
    balance: Number(client?.total_unpaid ?? 0),

    // Two different due dates
    invoiceDueDate: client?.invoice_due_date ?? "",  // FROM invoices
    nextDueDate: client?.next_due_date ?? "",        // FROM clients
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  const invoiceDueLabel = clientData.invoiceDueDate
  ? new Date(clientData.invoiceDueDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  : "—";

const nextDueLabel = clientData.nextDueDate
  ? new Date(clientData.nextDueDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  : "—";

  const invoiceActivities = (invoices ?? []).map((inv: any) => ({
    id: inv.id,
    type: "invoice",
    label: "Invoice Generated",
    date: inv.invoice_date ?? inv.created_at,
    meta: inv,
  }));

  const paymentActivities = (payments ?? []).map((p: any) => ({
    id: p.id,
    type: "payment",
    label: "Payment Received",
    date: p.payment_date ?? p.created_at,
    meta: p,
  }));

  const recentActivity = [...invoiceActivities, ...paymentActivities]
    .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")))
    .slice(0, 6);

  const paymentStatus = (() => {
    const total = Number(clientData.balance ?? 0);
    if (total <= 0) return "Paid";
    const due = clientData.invoiceDueDate ? new Date(clientData.invoiceDueDate) : null;
    if (!due) return "Pending Payment";

    const today = new Date();
    const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (dueOnly.getTime() === todayOnly.getTime()) return "Due Today";
    if (dueOnly.getTime() < todayOnly.getTime()) return "Overdue";
    return "Pending Payment";
  })();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-[#F5C400]/10 via-[#F5C400]/5 to-transparent border border-[#F5C400]/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome {clientData.name}
            </h2>
            <p className="text-[#A0A0A0]">
              Account ID:{" "}
              <span className="text-[#F5C400] font-mono">{clientData.accountId}</span>
            </p>
          </div>
          <StatusBadge status={clientData.status} />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#F5C400]/10 flex items-center justify-center">
              <Wifi className="w-6 h-6 text-[#F5C400]" />
            </div>
            <span className="px-3 py-1 bg-[#28C76F]/10 text-[#28C76F] text-xs font-semibold rounded-full">
              Active
            </span>
          </div>
          <h3 className="text-[#A0A0A0] text-sm mb-2">Current Subscription</h3>
          <p className="text-2xl font-bold text-white mb-1">{clientData.tier}</p>
          <p className="text-[#F5C400] font-semibold mb-3">{clientData.speed}</p>
          <div className="pt-3 border-t border-[#2A2A2A] flex items-center justify-between text-sm">
            <span className="text-[#A0A0A0]">Devices</span>
            <span className="text-white font-medium">
              {clientData.currentDevices}/{clientData.deviceLimit}
            </span>
          </div>
        </div>

        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#FF9F43]/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-[#FF9F43]" />
            </div>
            <Calendar className="w-5 h-5 text-[#A0A0A0]" />
          </div>
          <h3 className="text-[#A0A0A0] text-sm mb-2">Current Balance</h3>
          <p className="text-2xl font-bold text-white mb-1">
            ₱{clientData.balance.toLocaleString()}
          </p>
          <p className="text-[#A0A0A0] text-sm mb-3">Due Date: {invoiceDueLabel}</p>
          <Button size="sm" className="w-full bg-[#FF9F43] hover:bg-[#FF9F43]/90 text-white">
            Pay Now
          </Button>
        </div>

        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#28C76F]/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#28C76F]" />
            </div>
            <span className="text-xs font-medium text-white">{paymentStatus}</span>
          </div>
          <h3 className="text-[#A0A0A0] text-sm mb-2">Payment Status</h3>
          <p className="text-2xl font-bold text-white mb-3">{paymentStatus}</p>
          <div className="text-[#A0A0A0] text-sm">Next Due: {nextDueLabel}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="divide-y divide-[#2A2A2A]">
          {recentActivity.length === 0 ? (
            <div className="p-6 text-[#A0A0A0]">No recent activity.</div>
          ) : (
            recentActivity.map((item: any) => (
              <div key={item.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium mb-1">{item.label}</p>
                    <p className="text-[#A0A0A0] text-sm">
                      {item.date ? new Date(item.date).toLocaleString() : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    {item.type === "invoice" ? (
                      <span className="font-mono text-[#F5C400]">
                        {item.meta?.invoice_number ?? item.meta?.id}
                      </span>
                    ) : (
                      <span className="text-white">
                        ₱{Number(item.meta?.amount ?? 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
    </div>
  );
}