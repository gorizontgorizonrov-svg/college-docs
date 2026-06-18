"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { ReactNode, KeyboardEvent, MouseEvent } from "react";

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

  const handleClick = useCallback((e: MouseEvent<HTMLTableRowElement>) => {
    if (e.button === 0) {
      router.push(href);
    }
  }, [router, href]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(href);
    }
  }, [router, href]);

  return (
    <tr
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => router.prefetch(href)}
      tabIndex={0}
      role="button"
      className={`cursor-pointer ${className}`}
    >
      {children}
    </tr>
  );
}
