import React, { useEffect, useState } from "react";
import { supabase } from "@/app/shared/supabaseClient";
import { getPayments } from "../services/client.service";
import { useNavigate } from "react-router-dom";

export default function ClientPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cid = localStorage.getItem("client_id");
    if (!cid) return navigate("/internet/client/login");
    (async () => {
      try {
        const res = await getPayments();
        if (res?.data) setPayments(res.data || []);
        else setPayments([]);
      } catch (err) {
        console.error(err);
        setPayments([]);
      }
    })();
  }, [navigate]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Payment History</h2>
      <div className="bg-[#0B0B0B] border border-[#222] rounded p-4">
        {payments.length === 0 ? (
          <div>No payments found</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-gray-400">
                <th>Payment #</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-[#1a1a1a]">
                  <td className="py-2">{p.id}</td>
                  <td>{p.created_at}</td>
                  <td>{p.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
