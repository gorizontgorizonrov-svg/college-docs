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

  const where: Record<string, unknown> = {};
  if (params.action) where.action = params.action as AuditAction;
  if (params.userId) where.userId = params.userId;

  const rawLogs: any[] = await (prisma.auditLog.findMany as any)({
    where,
    include: { user: { include: { employee: true } } },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
  });
  const total = await prisma.auditLog.count({ where });

  const users = await prisma.user.findMany({
    include: { employee: true },
    orderBy: { email: "asc" },
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="anim-fade-in space-y-4">
      <h1 className="doc-h1">Журнал аудита</h1>

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

      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Записей: {total}</p>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Пользователь</th>
              <th>Действие</th>
              <th>Сущность</th>
              <th>Детали</th>
            </tr>
          </thead>
          <tbody>
            {rawLogs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {new Date(log.createdAt).toLocaleDateString("ru-RU", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </td>
                <td>
                  {log.user.employee
                    ? `${log.user.employee.lastName} ${log.user.employee.firstName}`
                    : log.user.email}
                </td>
                <td>
                  <span className="badge badge-info">
                    {actionLabels[log.action] || log.action}
                  </span>
                </td>
                <td>
                  {log.entityType} #{log.entityId?.slice(0, 8)}
                </td>
                <td style={{ color: "var(--text-muted)" }}>
                  {log.oldStatus && log.newStatus
                    ? `${log.oldStatus} → ${log.newStatus}`
                    : log.comment || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          {page > 1 && (
            <a href={`?page=${page - 1}${params.action ? `&action=${params.action}` : ""}${params.userId ? `&userId=${params.userId}` : ""}`}
              className="btn">Назад</a>
          )}
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{page} / {totalPages}</span>
          {page < totalPages && (
            <a href={`?page=${page + 1}${params.action ? `&action=${params.action}` : ""}${params.userId ? `&userId=${params.userId}` : ""}`}
              className="btn">Вперёд</a>
          )}
        </div>
      )}
    </div>
  );
}
