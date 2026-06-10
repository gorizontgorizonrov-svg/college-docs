"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineNotice() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-[var(--warning)]/100 text-white px-4 py-2 z-50 flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4" />
      <p className="text-sm font-medium">Нет подключения к интернету</p>
    </div>
  );
}
