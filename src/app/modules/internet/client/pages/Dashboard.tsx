import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// page rendered inside ClientDashboardLayout via routes
import { supabase } from "@/app/shared/supabaseClient";
import { getDashboard } from "../services/client.service";

import { formatDateMMDDYY } from "@/app/utils/formatDate";

interface DashboardSummary {
  invoiceTotal?: number;
  paymentTotal?: number;
  balance?: number;
  recentActivity?: any[];
  dueDate?: string | null;
}

export default function ClientDashboard() {
  const [client, setClient] = useState<any>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const cid = localStorage.getItem("client_id");
    if (!cid) {
      navigate("/internet/client/login");
      return;
    }

    const load = async () => {
      try {
        // Fetch dashboard via server endpoint (uses service role and cookie session)
        const resp = await getDashboard();
        if (!resp || resp?.error) {
          if (isMounted) navigate("/internet/client/login");
          return;
        }

        const clientData = resp.client;
        const summaryResp = resp.summary;
        if (!clientData) {
          if (isMounted) navigate("/internet/client/login");
          return;
        }

        if (!isMounted) return;
        setClient(clientData);

        const invoices = summaryResp?.invoices || [];
        const payments = summaryResp?.payments || [];

          const invoiceTotal = (invoices || []).reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
          const paymentTotal = (payments || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
          const balance = invoiceTotal - paymentTotal;

          const recentActivity = [ ...(invoices || []).slice(0,5), ...(payments || []).slice(0,5) ]
            .sort((a:any,b:any)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0,5);

          // Determine Due Date: use latest unpaid invoice due_date (closest upcoming), else fallback to client.next_due_date
          const unpaid = (invoices || []).filter((inv: any) => inv && inv.due_date && inv.status !== "paid");
          const sortedUnpaid = unpaid.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
          const dueDateFromInvoice = sortedUnpaid.length ? sortedUnpaid[0].due_date : null;
          const dueDateFinal = dueDateFromInvoice ?? (clientData?.next_due_date ?? null);

          if (!isMounted) return;
          setSummary({ invoiceTotal, paymentTotal, balance, recentActivity, dueDate: dueDateFinal ? String(dueDateFinal) : null });
      } catch (err) {
        // swallow / log if needed
        console.error(err);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (!client || !summary) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0B0B0B] border border-[#222] rounded">Room<br/><strong>{client.room || "—"}</strong></div>
          <div className="p-4 bg-[#0B0B0B] border border-[#222] rounded">Tier<br/><strong>{(client.tiers && client.tiers.name) ? client.tiers.name : (client.tier_name || "—")}</strong></div>
          <div className="p-4 bg-[#0B0B0B] border border-[#222] rounded">Status<br/><strong>{client.status || "—"}</strong></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0B0B0B] border border-[#222] rounded">Start Date<br/><strong>{client.start_date ? formatDateMMDDYY(client.start_date) : "—"}</strong></div>
          <div className="p-4 bg-[#0B0B0B] border border-[#222] rounded">Due Date<br/><strong>{summary?.dueDate ? formatDateMMDDYY(summary.dueDate) : "—"}</strong></div>
          <div className="p-4 bg-[#0B0B0B] border border-[#222] rounded">Balance<br/><strong>{summary?.balance ?? "—"}</strong></div>
        </div>

        <div className="p-4 bg-[#0B0B0B] border border-[#222] rounded">
          <h3 className="font-semibold mb-2">Recent Activity</h3>
          {summary?.recentActivity?.length ? (
            <ul>
              {summary.recentActivity.map((a: any, i: number) => (
                <li key={i} className="py-2 border-t border-[#1a1a1a]">{a.description || a.amount || JSON.stringify(a)}</li>
              ))}
            </ul>
          ) : (
            <div>No recent activity</div>
          )}
        </div>
      </div>
  );
}
