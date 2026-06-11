import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";
const actionLabels: Record<string, string> = {
  CREATE: "Создание", EDIT: "Редактирование", DELETE: "Удаление",
  APPROVE: "Согласование", REJECT: "Отклонение", RETURN: "Возврат",
  SIGN: "Подписание", REGISTER: "Регистрация", ARCHIVE: "Архивация",
  ASSIGN_RESOLUTION: "Резолюция", EXPORT: "Экспорт", LOGIN: "Вход",
  DOWNLOAD: "Скачивание",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; userId?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 50;
  const offset = (page - 1) * limit;

  const logsWhere = {
    action: params.action ? (params.action as AuditAction) : undefined,
    userId: params.userId || undefined,
  };

  const rawLogs = await prisma.auditLog.findMany({
    where: logsWhere as AuditLogWhereInput,
    include: { user: { include: { employee: true } } },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
  });
  const total = await prisma.auditLog.count({ where: logsWhere as AuditLogWhereInput });

  const users = await prisma.user.findMany({
    include: { employee: true },
    orderBy: { email: "asc" },
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Журнал аудита</h1>

        <form className="flex flex-col md:flex-row gap-3">
          <select name="action" defaultValue={params.action || ""} className="select md:w-48">
            <option value="">Все действия</option>
            {Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select name="userId" defaultValue={params.userId || ""} className="select md:w-48">
            <option value="">Все пользователи</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.employee ? `${u.employee.lastName} ${u.employee.firstName}` : u.email}
              </option>
            ))}
          </select>
          <button type="submit" className="btn">Фильтр</button>
        </form>

        <p className="text-sm text-[var(--text-muted)]">Записей: {total}</p>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className=" border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Дата</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Пользователь</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Действие</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Сущность</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Детали</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                  {rawLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-secondary)]">
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {log.user.employee
                        ? `${log.user.employee.lastName} ${log.user.employee.firstName}`
                        : log.user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-info px-2 py-1 text-xs rounded-full">
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {log.entityType} #{log.entityId?.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                      {log.oldStatus && log.newStatus
                        ? `${log.oldStatus} → ${log.newStatus}`
                        : log.comment || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            {page > 1 && (
              <a href={`?page=${page - 1}${params.action ? `&action=${params.action}` : ""}${params.userId ? `&userId=${params.userId}` : ""}`}
                className="btn">Назад</a>
            )}
            <span className="text-sm text-[var(--text-muted)]">{page} / {totalPages}</span>
            {page < totalPages && (
              <a href={`?page=${page + 1}${params.action ? `&action=${params.action}` : ""}${params.userId ? `&userId=${params.userId}` : ""}`}
                className="btn">Вперёд</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
