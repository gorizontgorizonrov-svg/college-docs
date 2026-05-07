"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, Image, FileText, X, Check, AlertCircle, FileIcon, File } from "lucide-react";
import { createDocument } from "@/actions/applicant";
import { getApplicantProfile } from "@/actions/auth";
import { useSession } from "next-auth/react";

const docTypeLabels: Record<string, string> = {
  SCHOOL_CERT: "Аттестат/свидетельство",
  PASSPORT: "Паспорт",
  MED_FORM_086: "Справка 086",
  MILITARY_DOC: "Приписное свидетельство",
  PHOTO: "Фото 3x4",
  OTHER: "Другое",
};

export function DocumentUploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const docType = searchParams.get("type") || "OTHER";
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Файл слишком большой (максимум 10 МБ)");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Недопустимый формат. Используйте JPEG, PNG или PDF");
      return;
    }

    setFile(selectedFile);
    setError(null);

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
      setPdfUrl(null);
    } else if (selectedFile.type === "application/pdf") {
      setPreview(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const blob = new Blob([e.target?.result as ArrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !session?.user) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Ошибка загрузки файла");
      }

      const { url, fileName, fileSize, mimeType } = await uploadRes.json();

      const applicant = await getApplicantProfile(session.user.id);

      if (!applicant) {
        throw new Error("Профиль не найден");
      }

      await createDocument({
        applicantId: applicant.id,
        type: docType as any,
        fileUrl: url,
        fileName,
        fileSize,
        mimeType,
      });

      router.push("/documents");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка при загрузке");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          {docType === "PHOTO" ? (
            <Image className="w-6 h-6 text-blue-600" />
          ) : (
            <FileText className="w-6 h-6 text-blue-600" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{docTypeLabels[docType] || docType}</p>
          <p className="text-sm text-gray-500">Загрузите документ</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {!file ? (
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors min-h-[200px] ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
          }`}
        >
          <Upload className={`w-8 h-8 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
          <p className="text-gray-600 text-center">
            Нажмите или перетащите файл
          </p>
          <p className="text-sm text-gray-400">
            JPEG, PNG или PDF, до 10 МБ
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            capture="environment"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {preview && (
            <div className="relative bg-gray-100 rounded-xl p-4">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}

          {pdfUrl && (
            <div className="relative bg-gray-100 rounded-xl p-4">
              <iframe
                src={pdfUrl}
                className="w-full h-64 rounded-lg"
                title="PDF Preview"
              />
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {file.type.startsWith("image/") ? (
              <Image className="w-5 h-5 text-gray-500" />
            ) : file.type === "application/pdf" ? (
              <FileText className="w-5 h-5 text-red-500" />
            ) : (
              <FileIcon className="w-5 h-5 text-gray-500" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(1)} КБ
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="p-2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px] disabled:opacity-50"
          >
            {uploading ? (
              <span>Загрузка...</span>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Загрузить документ
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}