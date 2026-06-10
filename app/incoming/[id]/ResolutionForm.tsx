"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setResolution } from "@/actions/incoming";
import { Send } from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: { name: string } | null;
}

export function ResolutionForm({ documentId, employees }: { documentId: string; employees: Employee[] }) {
  const router = useRouter();
  const [resolution, setResolutionText] = useState("");
  const [executorId, setExecutorId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolution || !executorId || !deadline) return;
    setIsSubmitting(true);
    try {
      await setResolution(documentId, resolution, executorId, deadline);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">Текст резолюции</label>
        <textarea
          value={resolution}
          onChange={(e) => setResolutionText(e.target.value)}
          className="input min-h-[100px] resize-y"
          placeholder="Введите резолюцию..."
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">Исполнитель</label>
        <select
          value={executorId}
          onChange={(e) => setExecutorId(e.target.value)}
          className="select"
          required
        >
          <option value="">Выберите сотрудника</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.lastName} {emp.firstName} {emp.position ? `(${emp.position.name})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">Срок исполнения</label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="input"
          required
        />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn btn-navy">
        {isSubmitting ? "Сохранение..." : (
          <>
            <Send className="w-4 h-4" />
            Назначить резолюцию
          </>
        )}
      </button>
    </form>
  );
}
