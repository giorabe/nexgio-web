import { useEffect } from "react";
import StatCard from "@/app/components/StatCard";
import StatusBadge from "@/app/components/StatusBadge";
import { useDashboard } from "@/app/modules/internet/admin/hooks/useDashboard";

import {
  Users,
  Wifi,
  DollarSign,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface ActivityItem {
  client: string;
  event: string;
  date: string;
  type: "invoice" | "payment";
}

const recentActivity: ActivityItem[] = [
  { client: "Maria Santos", event: "Payment Received", date: "2 hours ago", type: "payment" },
  { client: "Juan Dela Cruz", event: "Invoice Generated", date: "5 hours ago", type: "invoice" },
  { client: "Anna Reyes", event: "Payment Received", date: "1 day ago", type: "payment" },
  { client: "Pedro Garcia", event: "Invoice Generated", date: "1 day ago", type: "invoice" },
  { client: "Sofia Mendoza", event: "Payment Received", date: "2 days ago", type: "payment" },
  { client: "Carlos Rivera", event: "Invoice Generated", date: "2 days ago", type: "invoice" },
];
export default function DashboardHome() {
  const { data, loading, refresh, formatted } = useDashboard();

  useEffect(() => {
    // no-op: keep component reactive to dashboard hook
  }, []);

  return (
    <div className="space-y-6">
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Clients"
          value={loading ? "…" : String(data?.totalClients ?? 0)}
          icon={Users}
          trend={undefined}
          iconColor="#F5C400"
        />
        <StatCard
          title="Active Connections"
          value={loading ? "…" : String(data?.activeClients ?? 0)}
          icon={Wifi}
          trend={undefined}
          iconColor="#28C76F"
        />
        <StatCard
          title="Monthly Revenue"
          value={loading ? "…" : `₱${Number(data?.monthlyRevenuePaid ?? 0).toLocaleString()}`}
          icon={DollarSign}
          trend={undefined}
          iconColor="#F5C400"
        />
        <StatCard
          title="Pending Payments"
          value={loading ? "…" : String(data?.pendingInvoicesCount ?? 0)}
          icon={Clock}
          iconColor="#FF9F43"
        />
        <StatCard
          title="Overdue Accounts"
          value={loading ? "…" : String(data?.overdueInvoicesCount ?? 0)}
          icon={AlertTriangle}
          trend={undefined}
          iconColor="#EA5455"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#2A2A2A]">
          <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#161616]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">
                  Client Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">
                  Event
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#A0A0A0]">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {(formatted?.recentActivity ?? []).map((activity: any, index: number) => (
                <tr
                  key={index}
                  className="hover:bg-[#161616] transition-colors"
                >
                  <td className="px-6 py-4 text-white">{activity.clientName}</td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      status={activity.type === "payment" ? "paid" : "pending"}
                    >
                      {activity.label}
                    </StatusBadge>
                  </td>
                  <td className="px-6 py-4 text-[#A0A0A0]">{activity.relative ?? activity.dateISO}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Overview */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            Connection Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#A0A0A0]">Active Connections</span>
              <span className="text-white font-semibold">{loading ? "…" : String(data?.activeClients ?? 0)}</span>
            </div>
            <div className="w-full bg-[#161616] rounded-full h-2">
              <div
                className="bg-[#28C76F] h-2 rounded-full"
                style={{ width: `${data ? Math.round(((data.activeClients ?? 0) / Math.max(1, data.totalClients ?? 1)) * 100) : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[#A0A0A0]">Suspended</span>
              <span className="text-white font-semibold">{loading ? "…" : String(data?.suspendedClients ?? 0)}</span>
            </div>
            <div className="w-full bg-[#161616] rounded-full h-2">
              <div
                className="bg-[#EA5455] h-2 rounded-full"
                style={{ width: `${data ? Math.round(((data.suspendedClients ?? 0) / Math.max(1, data.totalClients ?? 1)) * 100) : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[#A0A0A0]">Inactive</span>
              <span className="text-white font-semibold">{loading ? "…" : String(data?.inactiveClients ?? 0)}</span>
            </div>
            <div className="w-full bg-[#161616] rounded-full h-2">
              <div
                className="bg-[#A0A0A0] h-2 rounded-full"
                style={{ width: `${data ? Math.round(((data.inactiveClients ?? 0) / Math.max(1, data.totalClients ?? 1)) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            Revenue Breakdown
          </h3>
          <div className="space-y-4">
            {(() => {
              const base = Number(data?.revenueBreakdownMonth.baseSubscriptions ?? 0);
              const extra = Number(data?.revenueBreakdownMonth.extraDevices ?? 0);
              const over = Number(data?.revenueBreakdownMonth.overcharges ?? 0);
              const total = base + extra + over || 1;
              const pBase = Math.round((base / total) * 100);
              const pExtra = Math.round((extra / total) * 100);
              const pOver = Math.round((over / total) * 100);
              return (
                <>
                  <div className="flex items-center justify-between p-4 bg-[#161616] rounded-lg">
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Base Subscriptions</p>
                      <p className="text-white font-semibold text-lg">{loading ? "…" : `₱${base.toLocaleString()}`}</p>
                    </div>
                    <div className="text-[#28C76F] text-sm">{loading ? "…" : `${pBase}%`}</div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#161616] rounded-lg">
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Extra Devices</p>
                      <p className="text-white font-semibold text-lg">{loading ? "…" : `₱${extra.toLocaleString()}`}</p>
                    </div>
                    <div className="text-[#F5C400] text-sm">{loading ? "…" : `${pExtra}%`}</div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#161616] rounded-lg">
                    <div>
                      <p className="text-[#A0A0A0] text-sm">Overcharges</p>
                      <p className="text-white font-semibold text-lg">{loading ? "…" : `₱${over.toLocaleString()}`}</p>
                    </div>
                    <div className="text-[#FF9F43] text-sm">{loading ? "…" : `${pOver}%`}</div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
