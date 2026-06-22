"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createAssignment } from "@/actions/assignments";
import { IconArrowLeft, IconDeviceFloppy, IconSubtask } from "@tabler/icons-react";
import Link from "next/link";

const schema = z.object({
  title: z.string().min(3, "Минимум 3 символа"),
  description: z.string().optional(),
  priority: z.string().min(1, "Выберите приоритет"),
  deadline: z.string().optional(),
  executorId: z.string().min(1, "Выберите исполнителя"),
  parentId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const priorities = [
  { value: "LOW", label: "Низкий", color: "var(--text-muted)" },
  { value: "MEDIUM", label: "Средний", color: "var(--text-primary)" },
  { value: "HIGH", label: "Высокий", color: "var(--warning)" },
  { value: "URGENT", label: "Срочно", color: "var(--danger)" },
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => setEmployees(d))
      .catch(() => {});
    fetch("/api/assignments/parents")
      .then((r) => r.json())
      .then((d) => setParents(d))
      .catch(() => {});
  }, []);

  const parentIdParam = searchParams.get("parentId") || "";

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { parentId: parentIdParam },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createAssignment({
        ...data,
        deadline: data.deadline || undefined,
        parentId: data.parentId || undefined,
      });
      if (result.error) throw new Error(result.error);
      router.push("/assignments");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedParent = parents.find((p) => p.id === parentIdParam);

  return (
    <div className="anim-fade-in">
      <div className="flex items-center gap-4">
        <Link
          href="/assignments"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]"
        >
          <IconArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {parentIdParam ? "Новая подзадача" : "Новое поручение"}
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-xl text-[var(--danger)] text-sm">
          {error}
        </div>
      )}

      {selectedParent && (
        <div className="p-3 rounded-xl text-sm" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
          <IconSubtask size={14} style={{ verticalAlign: -2 }} /> Родительское поручение: <strong>{selectedParent.title}</strong>
          {" — "}
          <span style={{ color: "var(--text-muted)" }}>
            {selectedParent.executor?.lastName} {selectedParent.executor?.firstName}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        {parents.length > 0 && !parentIdParam && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Родительское поручение <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(необязательно)</span>
            </label>
            <select {...register("parentId")} className="input">
              <option value="">— Нет, создать отдельное поручение —</option>
              {parents.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.title} — {p.executor?.lastName} {p.executor?.firstName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Исполнитель *</label>
          <select {...register("executorId")} className="input">
            <option value="">Выберите сотрудника</option>
            {employees.map((emp: any) => (
              <option key={emp.id} value={emp.id}>
                {emp.lastName} {emp.firstName} — {emp.position?.name || ""}
              </option>
            ))}
          </select>
          {errors.executorId && <p className="text-sm text-[var(--danger)]">{errors.executorId.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Название поручения *</label>
          <input {...register("title")} className="input" placeholder="Краткое описание задачи" />
          {errors.title && <p className="text-sm text-[var(--danger)]">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Описание</label>
          <textarea {...register("description")} className="input min-h-[120px] resize-y" placeholder="Подробное описание задачи..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Приоритет *</label>
            <select {...register("priority")} className="input">
              <option value="">Выберите приоритет</option>
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            {errors.priority && <p className="text-sm text-[var(--danger)]">{errors.priority.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Срок выполнения</label>
            <input {...register("deadline")} type="date" className="input" />
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn btn-navy">
          <IconDeviceFloppy className="w-4 h-4" />
          {isSubmitting ? "Сохранение..." : parentIdParam ? "Создать подзадачу" : "Создать поручение"}
        </button>
      </form>
    </div>
  );
}
