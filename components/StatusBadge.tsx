import { type ReactNode } from "react";

interface StatusBadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const variantMap = {
  success: "status-badge-success",
  warning: "status-badge-warning",
  danger: "status-badge-danger",
  info: "status-badge-info",
  neutral: "status-badge-neutral",
};

export default function StatusBadge({ variant = "neutral", children, icon, className = "" }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${variantMap[variant]} ${className}`}>
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}
