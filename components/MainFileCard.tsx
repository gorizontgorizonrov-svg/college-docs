"use client";

import { useState } from "react";
import { IconFileText, IconPhoto, IconEye, IconDownload } from "@tabler/icons-react";
import FilePreview from "./FilePreview";

export default function MainFileCard({ fileUrl }: { fileUrl: string }) {
  const [showPreview, setShowPreview] = useState(false);
  const fileName = fileUrl.split("/").pop() || "Файл";
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
        <div style={{ flexShrink: 0, color: "var(--accent)" }}>
          {isImage ? <IconPhoto size={20} /> : <IconFileText size={20} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={fileName}>
            {fileName}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => setShowPreview(true)}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.15s" }}
            title="Просмотреть"
          >
            <IconEye size={14} />
          </button>
          <a
            href={fileUrl}
            download
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.15s" }}
            title="Скачать"
          >
            <IconDownload size={14} />
          </a>
        </div>
      </div>
      {showPreview && (
        <FilePreview
          fileUrl={fileUrl}
          fileName={fileName}
          mimeType={isImage ? `image/${ext}` : "application/octet-stream"}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
