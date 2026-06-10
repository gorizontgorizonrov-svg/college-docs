"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/actions/notifications";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export function NotificationDropdown() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotifications = async () => {
      const [notifs, count] = await Promise.all([
        getMyNotifications(session.user.id),
        getUnreadCount(session.user.id),
      ]);
      setNotifications(notifs as any);
      setUnreadCount(count);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [session?.user?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    if (!session?.user?.id) return;
    await markAllAsRead(session.user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const getEntityLink = (n: Notification) => {
    if (n.entityType === "InternalDocument" && n.entityId) return `/documents/${n.entityId}`;
    if (n.entityType === "IncomingDocument" && n.entityId) return `/incoming/${n.entityId}`;
    return "#";
  };

  if (!session?.user) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-[var(--bg-secondary)]"
      >
        <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-[var(--danger)] rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
            <h3 className="font-semibold text-[var(--text-primary)]">Уведомления</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Все прочитано
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--text-muted)]">Нет уведомлений</div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <Link
                  key={n.id}
                  href={getEntityLink(n)}
                  onClick={() => { handleMarkRead(n.id); setIsOpen(false); }}
                  className={`block px-4 py-3 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] transition-colors ${
                    !n.isRead ? "bg-[var(--accent)]/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? "bg-[var(--accent)]" : "bg-transparent"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">{n.message}</p>
                      )}
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">
                        {new Date(n.createdAt).toLocaleDateString("ru-RU", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
