"use client";

import { useRef, useCallback, useState } from "react";
import { IconPrinter } from "@tabler/icons-react";

export default function PrintButton({ fileUrl }: { fileUrl?: string | null }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [printing, setPrinting] = useState(false);

  const handlePrint = useCallback(() => {
    if (!fileUrl) {
      window.print();
      return;
    }
    setPrinting(true);
    const iframe = iframeRef.current;
    if (!iframe) return;

    iframe.src = fileUrl;
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch {
          window.open(fileUrl, "_blank")?.print();
        }
        setPrinting(false);
      }, 500);
    };
    iframe.onerror = () => {
      window.open(fileUrl, "_blank");
      setPrinting(false);
    };
  }, [fileUrl]);

  return (
    <>
      <iframe ref={iframeRef} style={{ display: "none" }} title="print-frame" />
      <button type="button" className="btn btn-ghost" onClick={handlePrint} disabled={printing}>
        <IconPrinter size={16} />{printing ? "Печать..." : "Печать"}
      </button>
    </>
  );
}
