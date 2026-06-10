"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerIncoming } from "@/actions/incoming";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  incomingNumber: z.string().min(1, "Обязательное поле"),
  incomingDate: z.string().min(1, "Обязательное поле"),
  fromOrg: z.string().min(1, "Укажите отправителя"),
  outgoingNumber: z.string().optional(),
  outgoingDate: z.string().optional(),
  title: z.string().min(3, "Минимум 3 символа"),
  content: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterIncomingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { incomingDate: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await registerIncoming(data);
      router.push("/incoming");
    } catch (err: any) {
      setError(err.message || "Ошибка");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/incoming" className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
            <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Регистрация входящего документа</h1>
        </div>

        {error && <div className="p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-xl text-[var(--danger)] text-sm">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Входящий номер *</label>
              <input {...register("incomingNumber")} className="input" placeholder="Например: В-001" />
              {errors.incomingNumber && <p className="text-sm text-[var(--danger)]">{errors.incomingNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Дата *</label>
              <input {...register("incomingDate")} type="date" className="input" />
              {errors.incomingDate && <p className="text-sm text-[var(--danger)]">{errors.incomingDate.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">От кого *</label>
              <input {...register("fromOrg")} className="input" placeholder="МинОбр, ЖАГУ..." />
              {errors.fromOrg && <p className="text-sm text-[var(--danger)]">{errors.fromOrg.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Исходящий номер</label>
              <input {...register("outgoingNumber")} className="input" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Исходящая дата</label>
              <input {...register("outgoingDate")} type="date" className="input" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Заголовок *</label>
            <input {...register("title")} className="input" placeholder="Краткое содержание" />
            {errors.title && <p className="text-sm text-[var(--danger)]">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Содержание</label>
            <textarea {...register("content")} className="input min-h-[120px] resize-y" />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-navy">
            <Save className="w-4 h-4" />
            {isSubmitting ? "Сохранение..." : "Зарегистрировать"}
          </button>
        </form>
      </div>
    </div>
  );
}
