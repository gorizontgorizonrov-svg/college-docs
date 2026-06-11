"use client";

import { useState, useCallback } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";

interface FilePreviewProps {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  onClose?: () => void;
}

export default function FilePreview({
  fileUrl,
  fileName,
  mimeType,
  onClose,
}: FilePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v);
  }, []);

  const isImage = mimeType.startsWith("image/");

  const overlayClass = isFullscreen
    ? "preview-overlay preview-fullscreen"
    : "preview-overlay";

  return (
    <div className={overlayClass} onClick={onClose}>
      <div
        className="preview-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="preview-header">
          <span className="preview-filename" title={fileName}>
            {fileName}
          </span>
          <div className="preview-actions">
            <button
              onClick={toggleFullscreen}
              className="preview-btn"
              title={isFullscreen ? "Свернуть" : "На весь экран"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={onClose} className="preview-btn" title="Закрыть">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="preview-body">
          {isImage ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="preview-image"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <iframe
              src={fileUrl}
              className="preview-iframe"
              title={fileName}
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </div>

      <style jsx>{`
        .preview-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .preview-fullscreen .preview-container {
          width: 100%;
          height: 100%;
          max-width: none;
          max-height: none;
          border-radius: 0;
        }
        .preview-container {
          background: var(--card-bg, #fff);
          border-radius: 12px;
          max-width: 90vw;
          max-height: 90vh;
          width: 100%;
          height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }
        .preview-filename {
          font-weight: 500;
          font-size: 14px;
          color: var(--text, #111);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .preview-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        .preview-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          transition: background 0.15s;
        }
        .preview-btn:hover {
          background: var(--hover-bg, #f3f4f6);
        }
        .preview-body {
          flex: 1;
          overflow: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
        }
        .preview-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .preview-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
      `}</style>
    </div>
  );
}
