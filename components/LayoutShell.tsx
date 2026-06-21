"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Topbar, Sidebar } from "./navigation";
import { Footer } from "./Footer";
import AnimatedBackground from "./AnimatedBackground";
import MobileLayout from "./mobile/MobileLayout";

function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMobile();

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

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
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
