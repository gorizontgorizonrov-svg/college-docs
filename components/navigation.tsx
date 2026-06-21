"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationDropdown } from "./NotificationDropdown";
import { useTranslation } from "@/lib/i18n/client";
import {
  IconLayoutDashboard,
  IconFileText,
  IconInbox,
  IconArchive,
  IconUser,
  IconLogout,
  IconSearch,
  IconChevronDown,
  IconList,
  IconEdit,
  IconBook,
  IconPlus,
  IconSettings,
  IconUsers,
  IconClipboardList,
  IconX,
  IconMail,
  IconMenu2,
} from "@tabler/icons-react";

const navItems: { href: string; labelKey: string; Icon: any; badge?: boolean }[] = [
  { href: "/dashboard", labelKey: "nav.home", Icon: IconLayoutDashboard },
  { href: "/documents", labelKey: "nav.documents", Icon: IconFileText },
  { href: "/incoming", labelKey: "nav.incoming", Icon: IconInbox },
  { href: "/archive", labelKey: "nav.archive", Icon: IconArchive },
];

function getInitials(name?: string, email?: string) {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return email?.[0]?.toUpperCase() || "?";
}

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAuth = status === "authenticated";

  if (status === "loading" || !isAuth) {
    return (
      <header className="topbar">
        <Link href="/login" className="logo">
          <div className="logo-mark">{t("app.shortName")}</div>
          <div>
            <div className="logo-name">{t("app.name")}</div>
            <div className="logo-sub">{t("app.description")}</div>
          </div>
        </Link>
        <div className="topbar-right">
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
      <header className="topbar">
        <div className="topbar-left">
          {onToggleSidebar && (
            <button className="ib sidebar-toggle" onClick={onToggleSidebar} title={t("nav.menu")}>
              <IconMenu2 size={18} />
            </button>
          )}
          <Link href="/dashboard" className="logo">
            <div className="logo-mark">{t("app.shortName")}</div>
            <div>
              <div className="logo-name">{t("app.name")}</div>
              <div className="logo-sub">{t("app.description")}</div>
            </div>
          </Link>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`ni ${
                pathname === item.href ? "on" : ""
              }`}
            >
              <item.Icon size={18} />
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="topbar-right">
          <Link href="/archive" className="ib" title={t("nav.search")}><IconSearch size={18} /></Link>
          <NotificationDropdown />
          <Link href="/profile" className="ib" title={t("nav.profile")}><IconUser size={18} /></Link>
          <ThemeToggle />
          <div className="dv" />
          <div className="user-pill" onClick={() => setUserMenuOpen(true)}>
            <div className="uav">{getInitials(undefined, session?.user?.email || undefined)}</div>
            <div>
              <div className="uname">{session?.user?.email?.split("@")[0] || "User"}</div>
              <div className="urole">{t(`role.${session?.user?.role || ""}`)}</div>
            </div>
            <IconChevronDown size={12} style={{ color: "var(--text-muted)" }} />
          </div>
          <UserDrawer open={userMenuOpen} onClose={() => setUserMenuOpen(false)} />
        </div>
      </header>
  );
}

function UserDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    const redirect = () => { window.location.href = "/login"; };
    const fallback = setTimeout(redirect, 3000);
    try {
      await signOut({ redirect: false });
    } catch {
      // ignore
    }
    clearTimeout(fallback);
    redirect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {open && <div className="drawer-overlay" onClick={onClose} />}
      <div className={`drawer ${open ? "drawer-open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-title">{t("nav.profile")}</div>
          <button className="drawer-close" onClick={onClose}><IconX size={18} /></button>
        </div>

        <div className="drawer-user">
          <div className="drawer-avatar">{getInitials(undefined, session?.user?.email || undefined)}</div>
          <div className="drawer-name">{session?.user?.email?.split("@")[0] || "User"}</div>
          <div className="drawer-role">{t(`role.${session?.user?.role || ""}`)}</div>
        </div>

        <div className="drawer-body">
          <Link href="/profile" className="drawer-item" onClick={onClose}>
            <IconUser size={18} />
            <div>
              <div className="drawer-item-title">{t("nav.profile")}</div>
              <div className="drawer-item-sub">{t("profile.personalData")}</div>
            </div>
          </Link>
          <Link href="/settings" className="drawer-item" onClick={onClose}>
            <IconSettings size={18} />
            <div>
              <div className="drawer-item-title">{t("nav.settings")}</div>
              <div className="drawer-item-sub">{t("settings.appearanceDesc")}</div>
            </div>
          </Link>
          <Link href="/dashboard" className="drawer-item" onClick={onClose}>
            <IconLayoutDashboard size={18} />
            <div>
              <div className="drawer-item-title">{t("nav.dashboard")}</div>
              <div className="drawer-item-sub">{t("dashboard.statistics")}</div>
            </div>
          </Link>
          <Link href="/profile" className="drawer-item" onClick={onClose}>
            <IconMail size={18} />
            <div>
              <div className="drawer-item-title">{session?.user?.email || "—"}</div>
              <div className="drawer-item-sub">{t("profile.email")}</div>
            </div>
          </Link>
        </div>

        <div className="drawer-footer">
          <button className="drawer-item drawer-item-danger" onClick={handleSignOut} disabled={signingOut}>
            <IconLogout size={18} />
            <div>
              <div className="drawer-item-title">{signingOut ? t("auth.signingIn") : t("nav.logout")}</div>
              <div className="drawer-item-sub">{t("nav.logout")}</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

const sidebarSections: {
  labelKey: string;
  items: { href: string; labelKey: string; Icon: any; adminOnly?: boolean; createOnly?: boolean }[];
}[] = [
  {
    labelKey: "sidebar.documents",
    items: [
      { href: "/documents", labelKey: "nav.documents", Icon: IconFileText },
      { href: "/documents?type=ORDER", labelKey: "sidebar.orders", Icon: IconFileText },
      { href: "/documents?type=DIRECTIVE", labelKey: "sidebar.directives", Icon: IconList },
      { href: "/documents?type=MEMO", labelKey: "sidebar.memos", Icon: IconEdit },
      { href: "/documents?type=CONTRACT", labelKey: "sidebar.contracts", Icon: IconBook },
    ],
  },
  {
    labelKey: "sidebar.quickActions",
    items: [
      { href: "/profile", labelKey: "nav.profile", Icon: IconUser },
      { href: "/documents/create", labelKey: "sidebar.createDocument", Icon: IconPlus, createOnly: true },
      { href: "/admin/workflows", labelKey: "sidebar.templates", Icon: IconSettings, adminOnly: true },
    ],
  },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const role = session?.user?.role || "";
  const isAdmin = role === "ADMIN";
  const canCreate = role === "INITIATOR" || role === "VALIDATOR" || role === "ADMIN";

  const isActive = (href: string) => {
    if (href.includes("?")) {
      const [basePath, queryString] = href.split("?");
      if (pathname !== basePath) return false;
      const params = new URLSearchParams(queryString);
      return Array.from(params).every(([k, v]) => searchParams.get(k) === v);
    }
    return pathname === href;
  };

  const filteredSections = sidebarSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.createOnly && !canCreate) return false;
      return true;
    }),
  })).filter((s) => s.items.length > 0);

  return (
    <>
      {!collapsed && <div className="sidebar-overlay" onClick={onToggle} />}
      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
        {filteredSections.map((section) => (
          <div key={section.labelKey}>
            <div className="sb-label">{collapsed ? "—" : t(section.labelKey)}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sb-item ${isActive(item.href) ? "on" : ""}`}
                title={collapsed ? t(item.labelKey) : undefined}
              >
                <item.Icon size={18} className="sb-icon" />
                {!collapsed && <span className="sb-text">{t(item.labelKey)}</span>}
              </Link>
            ))}
          </div>
        ))}

        {isAdmin && !collapsed && (
          <>
            <div className="sb-label">{t("sidebar.administration")}</div>
            <Link href="/admin/employees" className={`sb-item ${isActive("/admin/employees") ? "on" : ""}`}>
              <IconUsers size={18} className="sb-icon" />
              <span className="sb-text">{t("sidebar.employees")}</span>
            </Link>
            <Link href="/admin/audit" className={`sb-item ${isActive("/admin/audit") ? "on" : ""}`}>
              <IconClipboardList size={18} className="sb-icon" />
              <span className="sb-text">{t("sidebar.audit")}</span>
            </Link>
          </>
        )}

        {isAdmin && collapsed && (
          <>
            <Link href="/admin/employees" className={`sb-item ${isActive("/admin/employees") ? "on" : ""}`} title={t("sidebar.employees")}>
              <IconUsers size={18} className="sb-icon" />
            </Link>
            <Link href="/admin/audit" className={`sb-item ${isActive("/admin/audit") ? "on" : ""}`} title={t("sidebar.audit")}>
              <IconClipboardList size={18} className="sb-icon" />
            </Link>
          </>
        )}
      </aside>
    </>
  );
}
