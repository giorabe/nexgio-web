import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../services/client.service";
import Header from "@/app/layout/Header";

export default function ClientLayout({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();

  async function doLogout() {
    await logout();
    try { localStorage.removeItem("role"); localStorage.removeItem("client_id"); } catch {}
    navigate("/internet/client/login");
  }

  return (
    <div className="flex h-screen bg-[#0F0F0F]">
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Client Portal" onMenuClick={() => {}} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4">
              <nav className="flex items-center gap-6 text-sm">
                <Link to="/internet/client/dashboard" className="text-[#F5C400]">Dashboard</Link>
                <Link to="/internet/client/invoices" className="text-white">Invoices</Link>
                <Link to="/internet/client/payments" className="text-white">Payments</Link>
                <Link to="/internet/client/settings" className="text-white">Settings</Link>
                <button onClick={doLogout} className="ml-4 text-sm text-[#F5C400]">Logout</button>
              </nav>
            </div>

            {children}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
