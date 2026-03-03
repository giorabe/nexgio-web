import { NavLink } from "react-router-dom";
import { useClientPortal } from "@/app/modules/internet/client/hooks/useClientPortal";
import { 
  LayoutDashboard, 
  FileText, 
  Wifi, 
  Settings,
  LogOut,
  X,
  Receipt
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signOut as signOutService } from "@/app/modules/internet/admin/services/auth.service";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/client/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Invoice History", path: "/client/invoices", icon: <FileText className="w-5 h-5" /> },
  { label: "Receipt History", path: "/client/receipts", icon: <Receipt className="w-5 h-5" /> },
  { label: "Settings", path: "/client/settings", icon: <Settings className="w-5 h-5" /> },
];

interface ClientSidebarProps {
  onClose?: () => void;
}

export default function ClientSidebar({ onClose }: ClientSidebarProps) {
  const navigate = useNavigate();

  const { client } = useClientPortal();
  const room = client?.room ? String(client.room) : null;

  const handleLogout = async () => {
    try {
      await signOutService();
    } catch (e) {
      // If signOut fails, continue to clear local data and redirect anyway
      console.warn("ClientSidebar: signOut failed", e);
    }

    try { localStorage.removeItem("clientId"); } catch {}
    try { localStorage.removeItem("nexgio_client_id"); } catch {}
    try { localStorage.removeItem("client_username"); } catch {}
    try { localStorage.removeItem("loginAt"); } catch {}
    try { localStorage.removeItem("role"); } catch {}

    // Replace current history entry and reload to prevent back-navigation to authenticated view
    try {
      window.location.replace("/client/services");
      return;
    } catch (e) {}

    navigate("/client/services", { replace: true });
  };

  return (
    <aside className="w-64 bg-[#161616] border-r border-[#2A2A2A] fixed top-0 left-0 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#2A2A2A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5C400] to-[#F5C400]/80 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-[#0F0F0F]" />
            </div>
            <div>
              <h2 className="text-white font-semibold">NexGio</h2>
              <p className="text-[#A0A0A0] text-xs">Client Portal</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-[#A0A0A0] hover:text-white"
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5C400] to-[#F5C400]/60 flex items-center justify-center">
            <span className="text-[#0F0F0F] font-semibold">{room ?? '-'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">Room #</p>
            <p className="text-[#A0A0A0] text-xs truncate"> </p>
          </div>
        </div>
      </div>

      {/* Navigation & Support Banner */}
      <div className="flex-1 flex flex-col">
        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/client/dashboard"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-[#F5C400] text-[#0F0F0F] font-semibold shadow-lg shadow-[#F5C400]/20"
                        : "text-[#A0A0A0] hover:bg-[#2A2A2A] hover:text-white"
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {/* Support Banner removed */}
      </div>

      {/* Logout - sticks to bottom */}
      <div className="p-4 border-t border-[#2A2A2A] mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#EA5455] hover:bg-[#EA5455]/10 transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
        <div className="mt-4 text-center text-xs text-[#A0A0A0]">© 2026 NexGio</div>
      </div>
    </aside>
  );
}