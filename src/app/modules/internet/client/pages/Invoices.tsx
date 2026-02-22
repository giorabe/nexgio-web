import React, { useEffect, useState } from "react";
import { supabase } from "@/app/shared/supabaseClient";
import { getInvoices } from "../services/client.service";
import { useNavigate } from "react-router-dom";

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cid = localStorage.getItem("client_id");
    if (!cid) return navigate("/internet/client/login");
    (async () => {
      try {
        const res = await getInvoices();
        if (res?.data) setInvoices(res.data || []);
        else setInvoices([]);
      } catch (err) {
        console.error(err);
        setInvoices([]);
      }
    })();
  }, [navigate]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Invoice History</h2>
      <div className="bg-[#0B0B0B] border border-[#222] rounded p-4">
        {invoices.length === 0 ? (
          <div>No invoices found</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-gray-400">
                <th>Invoice #</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-[#1a1a1a]">
                  <td className="py-2">{inv.id}</td>
                  <td>{inv.created_at}</td>
                  <td>{inv.amount}</td>
                  <td>{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
