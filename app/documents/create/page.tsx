"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createDocument } from "@/actions/documents";
import { ArrowLeft, Save, Send, Upload } from "lucide-react";
import Link from "next/link";

const docTypes = [
  { value: "ORDER", label: "Приказ" },
  { value: "DIRECTIVE", label: "Распоряжение" },
  { value: "PROTOCOL", label: "Протокол" },
  { value: "ACT", label: "Акт" },
  { value: "MEMO", label: "Служебная записка" },
  { value: "CONTRACT", label: "Договор" },
  { value: "REPORT", label: "Отчёт" },
];

const schema = z.object({
  title: z.string().min(3, "Минимум 3 символа"),
  type: z.string().min(1, "Выберите тип документа"),
  content: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateDocumentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let fileUrl: string | undefined;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (json.success) fileUrl = json.url;
      }

      const doc = await createDocument({
        title: data.title,
        content: data.content,
        type: data.type as any,
        fileUrl,
      });

      setCreatedDocId(doc.id);
    } catch (err: any) {
      setError(err.message || "Ошибка при создании документа");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdDocId) {
    return (
      <div className="min-h-screen ">
        <div className="w-full px-4 md:px-6 lg:px-8 py-6 max-w-lg mx-auto">
          <div className="card p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-[var(--success)]/10 rounded-full flex items-center justify-center mx-auto">
              <Save className="w-8 h-8 text-[var(--success)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Черновик сохранён</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  const { sendToWorkflow } = await import("@/actions/documents");
                  await sendToWorkflow(createdDocId);
                  router.push(`/documents/${createdDocId}`);
                }}
                className="btn btn-primary"
              >
                <Send className="w-4 h-4" />
                Отправить на согласование
              </button>
              <button
                onClick={() => router.push(`/documents/${createdDocId}`)}
                className="btn"
              >
                Остаться в черновике
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/documents" className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)]">
            <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Создание документа</h1>
        </div>

        <div className="max-w-3xl">
          {error && (
            <div className="mb-4 p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-xl text-[var(--danger)] text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="card p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Тип документа *</label>
                <select {...register("type")} className="select">
                  <option value="">Выберите тип</option>
                  {docTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {errors.type && <p className="text-sm text-[var(--danger)]">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Заголовок *</label>
                <input {...register("title")} className="input" placeholder="Введите заголовок документа" />
                {errors.title && <p className="text-sm text-[var(--danger)]">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Содержание</label>
                <textarea
                  {...register("content")}
                  className="input min-h-[200px] resize-y"
                  placeholder="Введите содержание документа..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Прикреплённый файл</label>
                <div className="border-2 border-dashed border-[var(--border-subtle)] rounded-xl p-6 text-center hover:border-[var(--accent)]/30 transition-colors">
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-muted)]">
                      {file ? file.name : "Нажмите для выбора файла"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
                {isSubmitting ? "Сохранение..." : (
                  <>
                    <Save className="w-4 h-4" />
                    Сохранить черновик
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
