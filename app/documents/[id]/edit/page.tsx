"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateDocument } from "@/actions/documents";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconCloudUpload,
  IconFile,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconFileTypeXls,
  IconPhoto,
  IconX,
  IconFileZip,
} from "@tabler/icons-react";
import Link from "next/link";

const schema = z.object({
  title: z.string().min(3, "Минимум 3 символа"),
  content: z.string().optional(),
  changeNote: z.string().min(1, "Опишите изменения"),
});

type FormData = z.infer<typeof schema>;

const ALLOWED_EXTS = ["pdf","doc","docx","xls","xlsx","ppt","pptx","jpg","jpeg","png","gif","webp","bmp","txt","csv","rtf","zip","rar","7z","gz","tar","odt","ods","odp"];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " Б";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " КБ";
  return (bytes / (1024 * 1024)).toFixed(1) + " МБ";
}

function getFileIcon(mimeType: string, size: number) {
  if (mimeType.startsWith("image/")) return <IconPhoto size={size} />;
  if (mimeType.includes("pdf")) return <IconFileTypePdf size={size} />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <IconFileTypeDoc size={size} />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("xls"))
    return <IconFileTypeXls size={size} />;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar"))
    return <IconFileZip size={size} />;
  return <IconFile size={size} />;
}

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [removeFile, setRemoveFile] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const [charCount, setCharCount] = useState(0);
  const charLimit = 10000;

  useEffect(() => {
    fetch(`/api/documents/${params.id}`)
      .then((r) => r.json())
      .then((doc) => {
        setValue("title", doc.title);
        setValue("content", doc.content || "");
        setCharCount((doc.content || "").length);
      })
      .catch(() => setError("Не удалось загрузить документ"))
      .finally(() => setLoading(false));
  }, [params.id, setValue]);

  const handleFileSelect = useCallback((f: File | null) => {
    setFileError(null);
    setRemoveFile(false);
    if (f) {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (f.size > MAX_FILE_SIZE) {
        setFileError(`Файл слишком большой (максимум 50 МБ)`);
        return;
      }
      if (!ext || !ALLOWED_EXTS.includes(ext)) {
        setFileError(`Недопустимый тип файла. Разрешены: ${ALLOWED_EXTS.join(", ")}`);
        return;
      }
    }
    setFile(f);
    if (filePreview) { URL.revokeObjectURL(filePreview); setFilePreview(null); }
    if (f && f.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(f));
    }
  }, [filePreview]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let fileUrl: string | null | undefined;
      let fileInfo: { originalName: string; storedName: string; mimeType: string; fileSize: number } | undefined;

      if (removeFile) {
        fileUrl = null;
      } else if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (json.success) {
          fileUrl = json.url;
          fileInfo = {
            originalName: json.fileName,
            storedName: json.storedName,
            mimeType: json.mimeType,
            fileSize: json.fileSize,
          };
        } else {
          throw new Error(json.error || "Ошибка загрузки файла");
        }
      }

      await updateDocument(params.id, {
        title: data.title,
        content: data.content,
        fileUrl,
        changeNote: data.changeNote,
        fileInfo,
      });

      router.push(`/documents/${params.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка при сохранении");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--text-muted)" }}>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="anim-fade-up">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/documents/${params.id}`}
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
          >
            <IconArrowLeft className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Редактирование документа</h1>
        </div>

        <div className="max-w-3xl">
          {error && (
            <div className="mb-4 p-4 rounded-xl text-sm" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="glass-card">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Заголовок и содержание
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Заголовок *</label>
                  <input
                    {...register("title")}
                    className="glass-input"
                    style={{ paddingLeft: 12 }}
                  />
                  {errors.title && <p className="text-xs" style={{ color: "var(--danger)" }}>{errors.title.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Содержание</label>
                  <textarea
                    {...register("content")}
                    className="glass-textarea"
                    style={{ minHeight: 220 }}
                    maxLength={charLimit}
                    onChange={(e) => setCharCount(e.target.value.length)}
                  />
                  <div className="flex justify-end">
                    <span className="text-xs" style={{ color: charCount > charLimit * 0.9 ? "var(--warning)" : "var(--text-muted)" }}>
                      {charCount.toLocaleString()} / {charLimit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Прикреплённый файл
              </h3>

              {fileError && (
                <p className="text-xs mb-2" style={{ color: "var(--danger)" }}>{fileError}</p>
              )}
              {removeFile && (
                <p className="text-xs mb-2" style={{ color: "var(--warning)" }}>Файл будет удалён после сохранения</p>
              )}
              {file || removeFile ? (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--glass-border)" }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--bg-hover)" }}>
                    {filePreview ? (
                      <img src={filePreview} alt="preview" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      getFileIcon(file ? file.type : "", 20)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {file ? file.name : "Файл будет удалён"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{file ? formatFileSize(file.size) : ""}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { handleFileSelect(null); setRemoveFile(false); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <IconX size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl p-8 text-center transition-all duration-200 cursor-pointer" style={{ border: "2px dashed var(--glass-border)" }}>
                    <input
                      type="file"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <IconCloudUpload className="w-10 h-10" style={{ color: "var(--text-muted)" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        Нажмите для выбора файла
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        PDF, DOC, XLS, JPG, PNG — до 50 МБ
                      </span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemoveFile(true)}
                    className="btn btn-danger"
                    style={{ alignSelf: "flex-start" }}
                  >
                    <IconX size={14} />
                    Удалить текущий файл
                  </button>
                </div>
              )}
            </div>

            <div className="glass-card">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Описание изменений
              </h3>
              <div className="space-y-1.5">
                <input
                  {...register("changeNote")}
                  className="glass-input"
                  style={{ paddingLeft: 12 }}
                  placeholder="Что изменилось в этой версии?"
                />
                {errors.changeNote && <p className="text-xs" style={{ color: "var(--danger)" }}>{errors.changeNote.message}</p>}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-t-transparent inline-block" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 1s linear infinite" }} />
                  Сохранение...
                </>
              ) : (
                <>
                  <IconDeviceFloppy className="w-4 h-4" />
                  Сохранить изменения
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
