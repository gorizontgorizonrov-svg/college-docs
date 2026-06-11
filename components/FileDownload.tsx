"use client";

import { useState } from "react";
import {
  Download,
  Eye,
  Copy,
  FileText,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  File,
  Loader2,
  Check,
} from "lucide-react";

import type { FileAttachment } from "@prisma/client";

interface FileAttachmentWithUploader extends FileAttachment {
  uploadedBy: {
    employee?: {
      firstName: string;
      lastName: string;
      position?: { name: string };
    } | null;
  } | null;
}

interface FileDownloadProps {
  file: FileAttachmentWithUploader;
  showPreview?: boolean;
  showHistory?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <FileImage size={20} />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return <FileSpreadsheet size={20} />;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z") || mimeType.includes("tar") || mimeType.includes("gzip"))
    return <FileArchive size={20} />;
  if (mimeType.includes("pdf"))
    return <FileText size={20} />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FileText size={20} />;
  return <File size={20} />;
}

function getFileTypeLabel(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "Изображение";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("msword")) return "Word";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "Excel";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "PowerPoint";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "Архив";
  if (mimeType.includes("text")) return "Текст";
  return "Файл";
}

export default function FileDownload({
  file,
  showPreview = true,
}: FileDownloadProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/download/${file.id}`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/api/download/${file.id}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="file-download-card">
      <div className="file-download-icon">{getFileIcon(file.mimeType)}</div>
      <div className="file-download-info">
        <div className="file-download-name" title={file.originalName}>
          {file.originalName}
        </div>
        <div className="file-download-meta">
          <span>{formatSize(file.fileSize)}</span>
          <span className="file-download-sep">•</span>
          <span>{getFileTypeLabel(file.mimeType)}</span>
          <span className="file-download-sep">•</span>
          <span>Загрузок: {file.downloadCount}</span>
          <span className="file-download-sep">•</span>
          <span>{formatDate(file.createdAt)}</span>
        </div>
        {file.uploadedBy?.employee && (
          <div className="file-download-uploader">
            {file.uploadedBy.employee.lastName} {file.uploadedBy.employee.firstName}
            {file.uploadedBy.employee.position && (
              <> — {file.uploadedBy.employee.position.name}</>
            )}
          </div>
        )}
      </div>
      <div className="file-download-actions">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="file-action-btn"
          title="Скачать"
        >
          {downloading ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
        </button>
        {showPreview && (
          <a
            href={`/api/files/${file.storedName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="file-action-btn"
            title="Просмотреть"
          >
            <Eye size={16} />
          </a>
        )}
        <button
          onClick={handleCopyLink}
          className="file-action-btn"
          title="Копировать ссылку"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      <style jsx>{`
        .file-download-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--card-bg);
          transition: border-color 0.15s;
        }
        .file-download-card:hover {
          border-color: var(--primary);
        }
        .file-download-icon {
          flex-shrink: 0;
          color: var(--primary);
        }
        .file-download-info {
          flex: 1;
          min-width: 0;
        }
        .file-download-name {
          font-weight: 500;
          font-size: 14px;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .file-download-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .file-download-sep {
          opacity: 0.4;
        }
        .file-download-uploader {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 1px;
        }
        .file-download-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }
        .file-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--card-bg);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }
        .file-action-btn:hover {
          background: var(--hover-bg);
          color: var(--primary);
          border-color: var(--primary);
        }
        .file-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
