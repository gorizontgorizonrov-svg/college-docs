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
  IconChevronDown,
  IconSettings,
  IconUsers,
  IconClipboardList,
  IconX,
  IconMail,
  IconMenu2,
  IconPlus,
  IconTemplate,
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
          <NotificationDropdown />
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

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const role = session?.user?.role || "";
  const isAdmin = role === "ADMIN";
  const canCreate = ["INITIATOR", "VALIDATOR", "ADMIN"].includes(role);
  const canApprove = ["VALIDATOR", "SIGNER", "ADMIN"].includes(role);
  const canRegister = ["REGISTRAR", "ADMIN"].includes(role);

  const isActive = (href: string) => {
    if (href.includes("?")) {
      const [basePath, queryString] = href.split("?");
      if (pathname !== basePath) return false;
      const params = new URLSearchParams(queryString);
      return Array.from(params).every(([k, v]) => searchParams.get(k) === v);
    }
    return pathname === href;
  };

  return (
    <>
      {!collapsed && <div className="sidebar-overlay" onClick={onToggle} />}
      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>

        {/* Quick Actions */}
        {!collapsed && (
          <>
            <div className="sb-label">{t("sidebar.quickActions")}</div>
            {canCreate && (
              <Link href="/documents/create" className={`sb-item ${isActive("/documents/create") ? "on" : ""}`}>
                <IconPlus size={18} className="sb-icon" />
                <span className="sb-text">{t("sidebar.createDocument")}</span>
              </Link>
            )}
            <Link href="/documents" className={`sb-item ${isActive("/documents") ? "on" : ""}`}>
              <IconFileText size={18} className="sb-icon" />
              <span className="sb-text">{t("sidebar.myDocuments")}</span>
            </Link>
            {canApprove && (
              <Link href="/documents/pending" className={`sb-item ${isActive("/documents/pending") ? "on" : ""}`}>
                <IconClipboardList size={18} className="sb-icon" />
                <span className="sb-text">{t("sidebar.pendingApproval")}</span>
              </Link>
            )}
            {canRegister && (
              <Link href="/incoming" className={`sb-item ${isActive("/incoming") ? "on" : ""}`}>
                <IconInbox size={18} className="sb-icon" />
                <span className="sb-text">{t("sidebar.incoming")}</span>
              </Link>
            )}
            <Link href="/archive" className={`sb-item ${isActive("/archive") ? "on" : ""}`}>
              <IconArchive size={18} className="sb-icon" />
              <span className="sb-text">{t("nav.archive")}</span>
            </Link>
            {isAdmin && (
              <Link href="/admin/workflows" className={`sb-item ${isActive("/admin/workflows") ? "on" : ""}`}>
                <IconTemplate size={18} className="sb-icon" />
                <span className="sb-text">{t("sidebar.templates")}</span>
              </Link>
            )}
          </>
        )}

        {collapsed && (
          <>
            {canCreate && (
              <Link href="/documents/create" className={`sb-item ${isActive("/documents/create") ? "on" : ""}`} title={t("sidebar.createDocument")}>
                <IconPlus size={18} className="sb-icon" />
              </Link>
            )}
            <Link href="/documents" className={`sb-item ${isActive("/documents") ? "on" : ""}`} title={t("sidebar.myDocuments")}>
              <IconFileText size={18} className="sb-icon" />
            </Link>
            {canApprove && (
              <Link href="/documents/pending" className={`sb-item ${isActive("/documents/pending") ? "on" : ""}`} title={t("sidebar.pendingApproval")}>
                <IconClipboardList size={18} className="sb-icon" />
              </Link>
            )}
            {canRegister && (
              <Link href="/incoming" className={`sb-item ${isActive("/incoming") ? "on" : ""}`} title={t("sidebar.incoming")}>
                <IconInbox size={18} className="sb-icon" />
              </Link>
            )}
            <Link href="/archive" className={`sb-item ${isActive("/archive") ? "on" : ""}`} title={t("nav.archive")}>
              <IconArchive size={18} className="sb-icon" />
            </Link>
            {isAdmin && (
              <Link href="/admin/workflows" className={`sb-item ${isActive("/admin/workflows") ? "on" : ""}`} title={t("sidebar.templates")}>
                <IconTemplate size={18} className="sb-icon" />
              </Link>
            )}
          </>
        )}

        {/* Administration */}
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
