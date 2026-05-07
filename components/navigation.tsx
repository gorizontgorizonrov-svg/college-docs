"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Home, User, FileText, Users, FileEdit, LogOut, Send, ClipboardList, BarChart3 } from "lucide-react";

const applicantNavItems = [
  { href: "/applicant", label: "Главная", icon: Home },
  { href: "/documents", label: "Документы", icon: FileText },
  { href: "/applicant/applications", label: "Заявления", icon: Send },
  { href: "/applicant/status", label: "Статус", icon: ClipboardList },
  { href: "/applicant/profile", label: "Профиль", icon: User },
];

const moderatorNavItems = [
  { href: "/moderator", label: "Главная", icon: Home },
  { href: "/moderator/applications", label: "Заявления", icon: Users },
  { href: "/moderator/reports", label: "Отчеты", icon: BarChart3 },
  { href: "/internal-docs", label: "Внутренние документы", icon: FileEdit },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const userRole = session?.user?.role;
  const isAuthorized = status === "authenticated";

  const navItems = userRole === "APPLICANT" ? applicantNavItems : userRole === "MODERATOR" || userRole === "ADMIN" ? moderatorNavItems : [];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const renderNavItem = (item: { href: string; label: string; icon: React.ElementType }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex flex-col items-center justify-center py-3 px-2 md:flex-row md:gap-2 text-xs md:text-sm transition-colors min-h-[44px] ${
          isActive
            ? "text-blue-600 md:bg-blue-50 md:rounded-lg md:px-4"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <Icon className="w-5 h-5 md:w-4 md:h-4" />
        <span className="hidden sm:inline">{item.label}</span>
      </Link>
    );
  };

  if (status === "loading") {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:relative md:border-b md:border-gray-200 md:bg-transparent z-50">
        <div className="flex justify-around md:justify-start md:px-4 md:py-2 max-w-screen-xl mx-auto">
          <div className="flex items-center justify-center py-3 px-2 text-gray-400">
            <span className="text-sm">Загрузка...</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:relative md:border-b md:border-gray-200 md:bg-transparent z-50">
      <div className="flex justify-around md:justify-start md:px-4 md:py-2 md:gap-1 max-w-screen-xl mx-auto">
        {isAuthorized && navItems.length > 0 ? (
          navItems.map(renderNavItem)
        ) : (
          <Link
            href="/login"
            className="flex flex-col items-center justify-center py-3 px-2 md:flex-row md:gap-2 text-xs md:text-sm text-gray-600 hover:text-gray-900 min-h-[44px]"
          >
            <User className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Войти</span>
          </Link>
        )}
        {isAuthorized && (
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center justify-center py-3 px-2 md:flex-row md:gap-2 text-xs md:text-sm text-gray-600 hover:text-red-600 transition-colors min-h-[44px]"
          >
            <LogOut className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        )}
      </div>
    </nav>
  );
}