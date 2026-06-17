import { type ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function GlassCard({ children, className = "", style, onClick }: GlassCardProps) {
  return (
    <div
      className={`glass-card ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
