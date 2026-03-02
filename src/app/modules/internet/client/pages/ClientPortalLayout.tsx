import { useState } from "react";
import { Toaster } from "@/app/shared/ui/sonner";
import { Outlet, useLocation } from "react-router-dom";
import ClientSidebar from "@/app/components/ClientSidebar";
import { Menu, Bell } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/client/dashboard": "Dashboard",
  "/client/invoices": "Invoice History",
  "/client/receipts": "Receipt History",
  "/client/service-info": "Internet Service Details",
  "/client/settings": "Account Settings",
};

export default function ClientPortalLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications] = useState(2);
  const pageTitle = pageTitles[location.pathname] || "Dashboard";

  return (
    <div className="flex min-h-screen bg-[#0F0F0F]">
      <Toaster position="top-right" />
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <ClientSidebar />
      </div>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <ClientSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-[#161616] border-b border-[#2A2A2A] px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Open menu"
                className="md:hidden text-white hover:text-[#F5C400] transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-semibold text-white">{pageTitle}</h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button aria-label="Notifications" className="relative p-2 rounded-lg hover:bg-[#2A2A2A] transition-colors">
                <Bell className="w-5 h-5 text-[#A0A0A0]" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#F5C400] rounded-full" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}