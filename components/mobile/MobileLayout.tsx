"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  IconLayoutDashboard, IconFileText, IconPlus, IconInbox, IconSettings, IconUsers,
} from "@tabler/icons-react";
import { getProfile } from "@/actions/profile";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    getProfile(session.user.id).then((data) => {
      if (data?.employee?.avatarUrl) setAvatarUrl(data.employee.avatarUrl);
    }).catch(() => {});
  }, [session?.user?.id]);

  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";

  const navItems = [
    { href: "/dashboard", label: "Главная", Icon: IconLayoutDashboard },
    { href: "/documents", label: "Документы", Icon: IconFileText },
    { href: "/documents/create", label: "Создать", Icon: IconPlus },
    { href: isAdmin ? "/admin/employees" : "/incoming", label: isAdmin ? "Админ" : "Входящие", Icon: isAdmin ? IconUsers : IconInbox },
    { href: "/settings", label: "Настройки", Icon: IconSettings },
  ];

  const isActive = (href: string) => {
    if (href === "/documents/create") return pathname === href;
    if (href === "/settings") return pathname === href;
    if (href === "/dashboard") return pathname === href || pathname === "/";
    if (href === "/admin/employees") return pathname.startsWith("/admin");
    return pathname.startsWith(href);
  };

  return (
    <div style={{
      background: "var(--bg-page)",
      minHeight: "100vh",
      maxWidth: 480,
      margin: "0 auto",
      paddingBottom: 72,
      position: "relative",
    }}>
      <header style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 14px 12px",
        borderBottom: "0.5px solid var(--border)",
        position: "sticky", top: 0,
        background: "var(--bg-page)",
        zIndex: 10,
      }}>
        <span style={{
          background: "var(--accent)", color: "#fff",
          fontSize: 10, fontWeight: 600,
          padding: "4px 7px", borderRadius: 6, whiteSpace: "nowrap",
        }}>
          ЖАК
        </span>
        <span style={{
          color: "var(--text-primary)", fontSize: 13, fontWeight: 500,
          flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
        }}>
          СЭД ЖАК ЖАГУ
        </span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <NotificationDropdown />
          <ThemeToggle />
          <div
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: avatarUrl ? "none" : "var(--accent)",
              color: "#fff", fontSize: 11, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden",
            }}
            role="button" tabIndex={0}
            onClick={() => router.push("/profile")}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              session?.user?.email?.[0]?.toUpperCase() || "?"
            )}
          </div>
        </div>
      </header>

      <main style={{ padding: "10px" }}>
        {children}
      </main>

      <nav style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "var(--bg-card)",
        borderTop: "0.5px solid var(--border)",
        display: "flex", justifyContent: "space-around",
        padding: "8px 0 20px",
        zIndex: 20, backdropFilter: "blur(16px)",
      }}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                cursor: "pointer", flex: 1,
                border: "none", background: "none", padding: 0, fontFamily: "inherit",
                color: active ? "var(--accent)" : "var(--text-muted)",
              }}
              aria-label={item.label}
            >
              <span style={{ fontSize: 20, display: "flex" }}>
                <item.Icon size={20} />
              </span>
              <span style={{ fontSize: 9 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
