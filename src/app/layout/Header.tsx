import { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, Menu } from "lucide-react";
import { Input } from "../shared/ui/input";
import { useAdminProfile } from "@/app/modules/internet/admin/hooks/useAdminProfile";
import { supabase } from "@/app/shared/supabaseClient";
import { useNavigate, useMatches } from "react-router-dom";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

// ✅ Type the route handle so TS knows about handle.title
type RouteHandle = {
  title?: string;
};

type MatchWithHandle = {
  handle?: RouteHandle;
};

export default function Header({ title, onMenuClick }: HeaderProps) {
  const [notifications] = useState(3);
  const { profile, loading } = useAdminProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // strongly type matches so TS understands handle.title
  const matches = useMatches() as Array<{ handle?: RouteHandle }>;

  const titleFromHandle =
    [...matches]
      .reverse()
      .find((m) => m.handle?.title)?.handle?.title;

  const pageTitle = titleFromHandle ?? title;

  const displayName = profile?.admin_full_name || profile?.username || "";
  const displayRole = profile?.admin_role || "";

  const getInitials = (name: string) => {
    if (!name) return "AU";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    try { localStorage.removeItem("role"); } catch {}
    navigate("/login");
  };

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="bg-[#161616] border-b border-[#2A2A2A] px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden text-white hover:text-[#F5C400] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-2xl font-semibold text-white">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-4 relative">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0]" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 w-64 bg-[#0F0F0F] border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:border-[#F5C400]"
            />
          </div>

          <button
            className="relative p-2 rounded-lg hover:bg-[#2A2A2A] transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5 text-[#A0A0A0]" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#EA5455] rounded-full" />
            )}
          </button>

          <div className="relative" ref={containerRef}>
            <button
              onClick={() => setMenuOpen((s) => !s)}
              className="flex items-center gap-3 pl-3 pr-2 py-2 rounded-lg hover:bg-[#2A2A2A] transition-colors"
              aria-haspopup="menu"
              aria-expanded="true"
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-white">
                  {loading ? "Loading..." : (displayName || "")}
                </p>
                <p className="text-xs text-[#A0A0A0]">{displayRole}</p>
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5C400] to-[#F5C400]/80 flex items-center justify-center">
                <span className="text-[#0F0F0F] font-semibold">
                  {getInitials(displayName || (profile?.username ?? ""))}
                </span>
              </div>

              <ChevronDown className="w-4 h-4 text-[#A0A0A0]" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-48 bg-[#0F0F0F] border border-[#2A2A2A] rounded-md shadow-lg py-2 z-50"
              >
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm rounded-md
                             text-red-400 hover:text-red-300
                             hover:bg-red-500/10
                             focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
