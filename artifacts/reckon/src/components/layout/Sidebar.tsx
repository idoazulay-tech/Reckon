import { Link, useLocation } from "wouter";
import { LayoutDashboard, Settings, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="flex w-64 flex-col gap-1 border-r border-border bg-card px-4 py-6">
      <div className="mb-5 px-3 py-2 font-syne text-2xl font-extrabold text-foreground">
        R<span className="text-primary">.</span>
      </div>

      <div className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto border-t border-border pt-4">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
