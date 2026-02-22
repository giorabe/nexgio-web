import { NavLink } from "react-router";
import { LayoutDashboard, FileText, CreditCard, Settings, LogOut } from "lucide-react";
import NexGioLogo from "../../../../../assets/NexGio LOGO B.png";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/internet/client/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Invoices", path: "/internet/client/invoices", icon: <FileText className="w-5 h-5" /> },
  { label: "Payments", path: "/internet/client/payments", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Settings", path: "/internet/client/settings", icon: <Settings className="w-5 h-5" /> },
];

export default function ClientSidebar({ onClose }: { onClose?: () => void }) {
  return (
    <aside className="w-64 bg-[#161616] border-r border-[#2A2A2A] min-h-screen flex flex-col">
      <div className="p-6 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10">
            <img src={NexGioLogo} alt="NexGio" className="w-10 h-auto object-cover rounded-lg" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Client Portal</h2>
            <p className="text-[#A0A0A0] text-xs">Client</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
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

      <div className="p-4 border-t border-[#2A2A2A]">
        <div className="text-xs text-[#A0A0A0] text-center">© 2026 NexGio</div>
      </div>
    </aside>
  );
}
