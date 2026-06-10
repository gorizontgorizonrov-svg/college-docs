"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const roleLabels: Record<string, string> = {
  INITIATOR: "Инициатор", VALIDATOR: "Согласующий",
  SIGNER: "Подписант", REGISTRAR: "Регистратор", ADMIN: "Администратор",
};

export function EmployeeEditForm({ employee, positions, departments }: { employee: any; positions: any[]; departments: any[] }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(employee.firstName);
  const [lastName, setLastName] = useState(employee.lastName);
  const [middleName, setMiddleName] = useState(employee.middleName || "");
  const [positionId, setPositionId] = useState(employee.positionId);
  const [departmentId, setDepartmentId] = useState(employee.departmentId || "");
  const [role, setRole] = useState(employee.user.role);
  const [isActive, setIsActive] = useState(employee.user.isActive);
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, middleName, positionId, departmentId, role, isActive, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5">
      {error && (
        <div className="p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-xl text-[var(--danger)] text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">Фамилия</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">Имя</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">Отчество</label>
        <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="input" />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">Email</label>
        <input value={employee.user.email} disabled className="input opacity-60" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">Должность</label>
          <select value={positionId} onChange={(e) => setPositionId(e.target.value)} className="select">
            {positions.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">Отдел</label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="select">
            <option value="">Без отдела</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">Роль</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="select">
          {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
        <label htmlFor="isActive" className="text-sm text-[var(--text-secondary)]">Активен</label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">Новый пароль (оставьте пустым, чтобы не менять)</label>
        <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" />
      </div>

      <button type="submit" disabled={isSubmitting} className="btn btn-navy w-full">
        {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
      </button>
    </form>
  );
}
