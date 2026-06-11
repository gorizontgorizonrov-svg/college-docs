"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateDocument } from "@/actions/documents";
import { ArrowLeft, Save, Upload } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  title: z.string().min(3, "Минимум 3 символа"),
  content: z.string().optional(),
  changeNote: z.string().min(1, "Опишите изменения"),
});

type FormData = z.infer<typeof schema>;

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    fetch(`/api/documents/${params.id}`)
      .then((r) => r.json())
      .then((doc) => {
        setValue("title", doc.title);
        setValue("content", doc.content || "");
      })
      .catch(() => setError("Не удалось загрузить документ"))
      .finally(() => setLoading(false));
  }, [params.id, setValue]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let fileUrl: string | undefined;
      let fileInfo: { originalName: string; storedName: string; mimeType: string; fileSize: number } | undefined;

      if (file) {
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
      <div className="min-h-screen  flex items-center justify-center">
        <p className="text-[var(--text-muted)]">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/documents/${params.id}`} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)]">
            <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Редактирование документа</h1>
        </div>

        <div className="max-w-3xl">
          {error && (
            <div className="mb-4 p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-xl text-[var(--danger)] text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="card p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Заголовок *</label>
                <input {...register("title")} className="input" />
                {errors.title && <p className="text-sm text-[var(--danger)]">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Содержание</label>
                <textarea
                  {...register("content")}
                  className="input min-h-[200px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Прикреплённый файл</label>
                <div className="border-2 border-dashed border-[var(--border-subtle)] rounded-xl p-6 text-center hover:border-[var(--accent)]/30 transition-colors">
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-muted)]">{file ? file.name : "Нажмите для выбора файла"}</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Описание изменений *</label>
                <input {...register("changeNote")} className="input" placeholder="Что изменилось в этой версии?" />
                {errors.changeNote && <p className="text-sm text-[var(--danger)]">{errors.changeNote.message}</p>}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-navy">
              {isSubmitting ? "Сохранение..." : (
                <>
                  <Save className="w-4 h-4" />
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
