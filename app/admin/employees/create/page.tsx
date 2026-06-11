"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const roleLabels: Record<string, string> = {
  INITIATOR: "Инициатор", VALIDATOR: "Согласующий",
  SIGNER: "Подписант", REGISTRAR: "Регистратор", ADMIN: "Администратор",
};

export default function CreateEmployeePage() {
  const router = useRouter();
  const [positions, setPositions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [positionId, setPositionId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [role, setRole] = useState("INITIATOR");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/positions").then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
    ]).then(([pos, deps]) => {
      setPositions(pos);
      setDepartments(deps);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName || !positionId) {
      setError("Заполните обязательные поля");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName, middleName, positionId, departmentId, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      router.push("/admin/employees");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/employees" className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)]">
            <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Добавление сотрудника</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-xl text-[var(--danger)] text-sm">{error}</div>
        )}

        {loading ? (
          <div className="card p-12 text-center text-[var(--text-muted)]">Загрузка...</div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Фамилия *</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Имя *</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Отчество</label>
              <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="input" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Пароль *</label>
                <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Введите или сгенерируйте" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Должность *</label>
                <select value={positionId} onChange={(e) => setPositionId(e.target.value)} className="select">
                  <option value="">Выберите</option>
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
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Роль в системе *</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="select">
                {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-navy w-full">
              {isSubmitting ? "Сохранение..." : "Создать сотрудника"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
