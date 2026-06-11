"use client";

import { useRouter } from "next/navigation";
import type { ReactNode, KeyboardEvent } from "react";

export function ClickableRow({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  const handleKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(href);
    }
  };

  return (
    <tr
      onClick={() => router.push(href)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      className={`cursor-pointer ${className}`}
    >
      {children}
    </tr>
  );
}
