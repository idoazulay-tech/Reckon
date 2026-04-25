import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { LogoMark } from "@/components/LogoMark";
import { Menu } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="aurora" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div className="app">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <main className="app-main">
          <div className="mobile-bar">
            <LogoMark />
            <button
              onClick={() => setMobileOpen(true)}
              className="menu-btn"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          </div>

          {children}
        </main>
      </div>
    </>
  );
}
