"use client";

import { useState, useCallback } from "react";
import { IconX, IconMaximize, IconMinimize, IconDownload, IconLoader2 } from "@tabler/icons-react";

interface FilePreviewProps {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileId?: string;
  onClose?: () => void;
}

export default function FilePreview({
  fileUrl,
  fileName,
  mimeType,
  fileId,
  onClose,
}: FilePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!fileId) return;
    setDownloading(true);
    try {
      const response = await fetch(`/api/download/${fileId}`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloading(false);
    }
  }, [fileId, fileName]);

  const isImage = mimeType.startsWith("image/");

  return (
    <div
      className="preview-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(10, 12, 22, 0.6)",
          backdropFilter: "blur(24px)",
          border: "1px solid var(--glass-border)",
          borderRadius: isFullscreen ? 0 : 16,
          maxWidth: isFullscreen ? "100%" : "90vw",
          maxHeight: isFullscreen ? "100%" : "90vh",
          width: "100%",
          height: isFullscreen ? "100%" : "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--glass-border)" }}>
          <span style={{ fontWeight: 500, fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={fileName}>
            {fileName}
          </span>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {fileId && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, border: "none", background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", cursor: "pointer", transition: "background 0.15s" }}
                title="Скачать"
              >
                {downloading ? <IconLoader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <IconDownload size={16} />}
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, border: "none", background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", cursor: "pointer", transition: "background 0.15s" }}
              title={isFullscreen ? "Свернуть" : "На весь экран"}
            >
              {isFullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
            </button>
            <button
              onClick={onClose}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, border: "none", background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", cursor: "pointer", transition: "background 0.15s" }}
              title="Закрыть"
            >
              <IconX size={16} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
          {isImage ? (
            <img
              src={fileUrl}
              alt={fileName}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <iframe
              src={fileUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              title={fileName}
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </div>
    </div>
  );
}
