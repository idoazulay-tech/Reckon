import { Link, useLocation } from "wouter";
import { LayoutDashboard, Settings, LogOut, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LogoMark } from "@/components/LogoMark";

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const nameStr: string = user?.user_metadata?.full_name ?? "";
  const initials = nameStr
    ? nameStr.split(" ").map((s: string) => s[0]).slice(0, 2).join("")
    : (user?.email?.charAt(0).toUpperCase() ?? "U");

  return (
    <>
      <div
        className={`mobile-sidebar-backdrop${mobileOpen ? " open" : ""}`}
        onClick={onClose}
      />
      <aside className={`sidebar-wrap${mobileOpen ? " open" : ""}`}>
        <div className="sidebar-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <LogoMark />
          <button
            onClick={onClose}
            className="menu-btn"
            style={{ display: "none" }}
            id="sidebar-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="nav-list" style={{ flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`nav-item${isActive ? " active" : ""}`}
              >
                <Icon size={16} className="nav-ico" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="nav-divider" />

        <div className="sidebar-foot">
          <button
            onClick={() => { logout(); onClose(); }}
            className="nav-item"
            style={{ width: "100%", textAlign: "left", marginBottom: 12 }}
          >
            <LogOut size={16} className="nav-ico" />
            Logout
          </button>

          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div className="who">
              <div className="uname">{nameStr || "Account"}</div>
              <div className="uemail">{user?.email ?? ""}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
