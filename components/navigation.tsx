"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationDropdown } from "./NotificationDropdown";
import { useTranslation } from "@/lib/i18n/client";
import {
  LayoutDashboard,
  FileSignature,
  FileText,
  Inbox,
  Archive,
  User,
  LogOut,
  Search,
  ChevronDown,
  List,
  FileEdit,
  BookOpen,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  Plus,
  Settings,
  Users,
  ClipboardList,
  X,
  Mail,
  Menu,
} from "lucide-react";

const navItems: { href: string; labelKey: string; Icon: any; badge?: boolean }[] = [
  { href: "/dashboard", labelKey: "nav.home", Icon: LayoutDashboard },
  { href: "/documents/pending", labelKey: "nav.pending", Icon: FileSignature, badge: true },
  { href: "/documents", labelKey: "nav.documents", Icon: FileText },
  { href: "/incoming", labelKey: "nav.incoming", Icon: Inbox },
  { href: "/archive", labelKey: "nav.archive", Icon: Archive },
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
              <Menu size={18} />
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
                pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
                  ? "on"
                  : ""
              }`}
            >
              <item.Icon size={18} />
              {t(item.labelKey)}
              {item.badge && pathname.startsWith("/documents/pending") && <span className="ndot" />}
            </Link>
          ))}
        </nav>

        <div className="topbar-right">
          <button className="ib" title={t("nav.search")}><Search size={18} /></button>
          <NotificationDropdown />
          <ThemeToggle />
          <div className="dv" />
          <div className="user-pill" onClick={() => setUserMenuOpen(true)}>
            <div className="uav">{getInitials(undefined, session?.user?.email || undefined)}</div>
            <div>
              <div className="uname">{session?.user?.email?.split("@")[0] || "User"}</div>
              <div className="urole">{t(`role.${session?.user?.role || ""}`)}</div>
            </div>
            <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
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
          <button className="drawer-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="drawer-user">
          <div className="drawer-avatar">{getInitials(undefined, session?.user?.email || undefined)}</div>
          <div className="drawer-name">{session?.user?.email?.split("@")[0] || "User"}</div>
          <div className="drawer-role">{t(`role.${session?.user?.role || ""}`)}</div>
        </div>

        <div className="drawer-body">
          <Link href="/profile" className="drawer-item" onClick={onClose}>
            <User size={18} />
            <div>
              <div className="drawer-item-title">{t("nav.profile")}</div>
              <div className="drawer-item-sub">{t("profile.personalData")}</div>
            </div>
          </Link>
          <Link href="/settings" className="drawer-item" onClick={onClose}>
            <Settings size={18} />
            <div>
              <div className="drawer-item-title">{t("nav.settings")}</div>
              <div className="drawer-item-sub">{t("settings.appearanceDesc")}</div>
            </div>
          </Link>
          <Link href="/dashboard" className="drawer-item" onClick={onClose}>
            <LayoutDashboard size={18} />
            <div>
              <div className="drawer-item-title">{t("nav.dashboard")}</div>
              <div className="drawer-item-sub">{t("dashboard.statistics")}</div>
            </div>
          </Link>
          <Link href="/profile" className="drawer-item" onClick={onClose}>
            <Mail size={18} />
            <div>
              <div className="drawer-item-title">{session?.user?.email || "—"}</div>
              <div className="drawer-item-sub">{t("profile.email")}</div>
            </div>
          </Link>
        </div>

        <div className="drawer-footer">
          <button className="drawer-item drawer-item-danger" onClick={handleSignOut} disabled={signingOut}>
            <LogOut size={18} />
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
      { href: "/documents?type=DIRECTIVE", labelKey: "sidebar.directives", Icon: List },
      { href: "/documents?type=ORDER", labelKey: "sidebar.orders", Icon: FileText },
      { href: "/documents?type=MEMO", labelKey: "sidebar.memos", Icon: FileEdit },
      { href: "/documents?type=CONTRACT", labelKey: "sidebar.contracts", Icon: BookOpen },
    ],
  },
  {
    labelKey: "sidebar.statuses",
    items: [
      { href: "/documents/pending", labelKey: "sidebar.waiting", Icon: Clock },
      { href: "/documents?status=IN_APPROVAL", labelKey: "sidebar.inProgress", Icon: RefreshCw },
      { href: "/documents?status=APPROVED", labelKey: "sidebar.completed", Icon: CheckCircle },
      { href: "/documents?status=REJECTED", labelKey: "sidebar.rejected", Icon: XCircle },
    ],
  },
  {
    labelKey: "sidebar.quickActions",
    items: [
      { href: "/documents/create", labelKey: "sidebar.createDocument", Icon: Plus, createOnly: true },
      { href: "/admin/workflows", labelKey: "sidebar.templates", Icon: Settings, adminOnly: true },
    ],
  },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const role = session?.user?.role || "";
  const isAdmin = role === "ADMIN";
  const canCreate = role === "INITIATOR" || role === "VALIDATOR" || role === "ADMIN";

  const isActive = (href: string) => {
    if (href.includes("?")) {
      const [base] = href.split("?");
      return pathname === base;
    }
    return pathname === href || pathname.startsWith(href + "/");
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
              <Users size={18} className="sb-icon" />
              <span className="sb-text">{t("sidebar.employees")}</span>
            </Link>
            <Link href="/admin/audit" className={`sb-item ${isActive("/admin/audit") ? "on" : ""}`}>
              <ClipboardList size={18} className="sb-icon" />
              <span className="sb-text">{t("sidebar.audit")}</span>
            </Link>
          </>
        )}

        {isAdmin && collapsed && (
          <>
            <Link href="/admin/employees" className={`sb-item ${isActive("/admin/employees") ? "on" : ""}`} title={t("sidebar.employees")}>
              <Users size={18} className="sb-icon" />
            </Link>
            <Link href="/admin/audit" className={`sb-item ${isActive("/admin/audit") ? "on" : ""}`} title={t("sidebar.audit")}>
              <ClipboardList size={18} className="sb-icon" />
            </Link>
          </>
        )}
      </aside>
    </>
  );
}
