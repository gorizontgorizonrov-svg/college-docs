"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationDropdown } from "./NotificationDropdown";
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

const navItems = [
  { href: "/dashboard", label: "Главная", Icon: LayoutDashboard },
  { href: "/documents/pending", label: "На подпись", Icon: FileSignature, badge: true },
  { href: "/documents", label: "Документы", Icon: FileText },
  { href: "/incoming", label: "Входящие", Icon: Inbox },
  { href: "/archive", label: "Архив", Icon: Archive },
];

function getInitials(name?: string, email?: string) {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return email?.[0]?.toUpperCase() || "?";
}

const roleLabels: Record<string, string> = {
  INITIATOR: "Инициатор",
  VALIDATOR: "Согласующий",
  SIGNER: "Подписант",
  REGISTRAR: "Регистратор",
  ADMIN: "Администратор",
};

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAuth = status === "authenticated";

  if (status === "loading" || !isAuth) {
    return (
      <header className="topbar">
        <Link href="/login" className="logo">
          <div className="logo-mark">ЖАК</div>
          <div>
            <div className="logo-name">СЭД ЖАК ЖАГУ</div>
            <div className="logo-sub">Электронный документооборот</div>
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
          <button className="ib sidebar-toggle" onClick={onToggleSidebar} title="Меню">
            <Menu size={18} />
          </button>
        )}
        <Link href="/dashboard" className="logo">
          <div className="logo-mark">ЖАК</div>
          <div>
            <div className="logo-name">СЭД ЖАК ЖАГУ</div>
            <div className="logo-sub">Электронный документооборот</div>
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
            {item.label}
            {item.badge && pathname.startsWith("/documents/pending") && <span className="ndot" />}
          </Link>
        ))}
      </nav>

      <div className="topbar-right">
        <button className="ib" title="Поиск"><Search size={18} /></button>
        <NotificationDropdown />
        <ThemeToggle />
        <div className="dv" />
        <div className="user-pill" onClick={() => setUserMenuOpen(true)}>
          <div className="uav">{getInitials(undefined, session?.user?.email || undefined)}</div>
          <div>
            <div className="uname">{session?.user?.email?.split("@")[0] || "User"}</div>
            <div className="urole">{session?.user?.role || ""}</div>
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
          <div className="drawer-title">Профиль</div>
          <button className="drawer-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="drawer-user">
          <div className="drawer-avatar">{getInitials(undefined, session?.user?.email || undefined)}</div>
          <div className="drawer-name">{session?.user?.email?.split("@")[0] || "User"}</div>
          <div className="drawer-role">{roleLabels[session?.user?.role || ""] || session?.user?.role || ""}</div>
        </div>

        <div className="drawer-body">
          <Link href="/profile" className="drawer-item" onClick={onClose}>
            <User size={18} />
            <div>
              <div className="drawer-item-title">Профиль</div>
              <div className="drawer-item-sub">Личные данные и настройки</div>
            </div>
          </Link>
          <Link href="/dashboard" className="drawer-item" onClick={onClose}>
            <LayoutDashboard size={18} />
            <div>
              <div className="drawer-item-title">Дашборд</div>
              <div className="drawer-item-sub">Сводка по документам</div>
            </div>
          </Link>
          <Link href="/profile" className="drawer-item" onClick={onClose}>
            <Mail size={18} />
            <div>
              <div className="drawer-item-title">{session?.user?.email || "—"}</div>
              <div className="drawer-item-sub">Электронная почта</div>
            </div>
          </Link>
        </div>

        <div className="drawer-footer">
          <button className="drawer-item drawer-item-danger" onClick={handleSignOut} disabled={signingOut}>
            <LogOut size={18} />
            <div>
              <div className="drawer-item-title">{signingOut ? "Выход..." : "Выйти"}</div>
              <div className="drawer-item-sub">Завершить сеанс</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

const sidebarSections: {
  label: string;
  items: { href: string; label: string; Icon: any; adminOnly?: boolean; createOnly?: boolean }[];
}[] = [
  {
    label: "Документы",
    items: [
      { href: "/documents?type=DIRECTIVE", label: "Распоряжения", Icon: List },
      { href: "/documents?type=ORDER", label: "Приказы", Icon: FileText },
      { href: "/documents?type=MEMO", label: "Служебные записки", Icon: FileEdit },
      { href: "/documents?type=CONTRACT", label: "Договоры", Icon: BookOpen },
    ],
  },
  {
    label: "Статусы",
    items: [
      { href: "/documents/pending", label: "Ожидают меня", Icon: Clock },
      { href: "/documents?status=IN_APPROVAL", label: "В процессе", Icon: RefreshCw },
      { href: "/documents?status=APPROVED", label: "Завершённые", Icon: CheckCircle },
      { href: "/documents?status=REJECTED", label: "Отклонённые", Icon: XCircle },
    ],
  },
  {
    label: "Быстрые действия",
    items: [
      { href: "/documents/create", label: "Создать документ", Icon: Plus, createOnly: true },
      { href: "/admin/workflows", label: "Шаблоны", Icon: Settings, adminOnly: true },
    ],
  },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
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
          <div key={section.label}>
            <div className="sb-label">{collapsed ? "—" : section.label}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sb-item ${isActive(item.href) ? "on" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <item.Icon size={18} className="sb-icon" />
                {!collapsed && <span className="sb-text">{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}

        {isAdmin && !collapsed && (
          <>
            <div className="sb-label">Администрирование</div>
            <Link href="/admin/employees" className={`sb-item ${isActive("/admin/employees") ? "on" : ""}`}>
              <Users size={18} className="sb-icon" />
              <span className="sb-text">Сотрудники</span>
            </Link>
            <Link href="/admin/audit" className={`sb-item ${isActive("/admin/audit") ? "on" : ""}`}>
              <ClipboardList size={18} className="sb-icon" />
              <span className="sb-text">Аудит</span>
            </Link>
          </>
        )}

        {isAdmin && collapsed && (
          <>
            <Link href="/admin/employees" className={`sb-item ${isActive("/admin/employees") ? "on" : ""}`} title="Сотрудники">
              <Users size={18} className="sb-icon" />
            </Link>
            <Link href="/admin/audit" className={`sb-item ${isActive("/admin/audit") ? "on" : ""}`} title="Аудит">
              <ClipboardList size={18} className="sb-icon" />
            </Link>
          </>
        )}
      </aside>
    </>
  );
}
