"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import Link from "next/link";
import { updateDocStatus } from "@/actions/moderator";

export default function DocumentViewerPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const router = useRouter();
  const { id, docId } = use(params);
  const [zoom, setZoom] = useState(100);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/moderator/applications/${id}`}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-xl font-bold">Просмотр документа</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="px-2 text-sm min-w-[50px] text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div 
            className="p-4 overflow-auto flex items-center justify-center"
            style={{ maxHeight: "70vh" }}
          >
            <img
              src={`/uploads/${docId}`}
              alt="Документ"
              style={{ 
                transform: `scale(${zoom / 100})`, 
                transformOrigin: "top center",
                maxWidth: "100%",
                height: "auto"
              }}
              className="transition-transform"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/moderator/applications/${id}`}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors min-h-[44px]"
          >
            <Check className="w-5 h-5" />
            Одобрить
          </Link>
          <Link
            href={`/moderator/applications/${id}`}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors min-h-[44px]"
          >
            <X className="w-5 h-5" />
            Отклонить
          </Link>
        </div>
      </div>
    </div>
  );
}