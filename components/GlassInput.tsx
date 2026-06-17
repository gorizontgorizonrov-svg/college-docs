"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ icon, className = "", style, ...props }, ref) => {
    return (
      <div style={{ position: "relative", width: "100%" }}>
        {icon && (
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
              display: "flex",
            }}
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`glass-input ${className}`}
          style={{ ...(icon ? { paddingLeft: 36 } : {}), ...style }}
          {...props}
        />
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";

export default GlassInput;
