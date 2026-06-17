"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Topbar, Sidebar } from "./navigation";
import { Footer } from "./Footer";
import AnimatedBackground from "./AnimatedBackground";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  if (pathname === "/login") {
    return (
      <>
        <AnimatedBackground />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </>
    );
  }

  return (
    <div className="app" style={{ position: "relative", zIndex: 1 }}>
      <AnimatedBackground />
      <Topbar onToggleSidebar={toggleSidebar} />
      <div className={`layout ${!sidebarOpen ? "sidebar-closed" : ""}`}>
        <Sidebar collapsed={!sidebarOpen} onToggle={toggleSidebar} />
        <main className="main">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
