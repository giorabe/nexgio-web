import { useState } from "react";
import { Outlet } from "react-router";
import ClientSidebar from "../components/ClientSidebar";
import Header from "@/app/layout/Header";
import { Toaster } from "@/app/shared/ui/sonner";

export default function ClientDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0F0F0F]">
      <Toaster position="top-right" />

      <div className="hidden md:block">
        <ClientSidebar />
      </div>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <ClientSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Client Portal" onMenuClick={() => setSidebarOpen((s) => !s)} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
