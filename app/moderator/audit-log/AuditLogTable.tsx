"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuditLogEntry {
  id: string;
  moderatorId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldStatus: string | null;
  newStatus: string | null;
  comment: string | null;
  createdAt: any;
}

export default function AuditLogTable({ logs }: { logs: AuditLogEntry[] }) {
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      APPROVE: "Одобрено",
      REJECT: "Отклонено",
      REQUEST_INFO: "Запрос инф.",
      UPDATE_STATUS: "Изменение",
      CREATE: "Создано",
      DELETE: "Удалено",
      EXPORT: "Экспорт",
      ENROLL: "Зачислен",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      APPROVE: "bg-green-100 text-green-800",
      REJECT: "bg-red-100 text-red-800",
      ENROLL: "bg-blue-100 text-blue-800",
      EXPORT: "bg-purple-100 text-purple-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/moderator/reports" className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border hover:bg-gray-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Журнал аудита</h1>
        </div>

        <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Дата</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Действие</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Сущность</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Изменение</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="px-4 py-3 text-sm">{new Date(log.createdAt).toLocaleString("ru-RU")}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{log.entityType}</td>
                  <td className="px-4 py-3 text-sm font-mono">{String(log.entityId).slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm">
                    {log.oldStatus && log.newStatus ? (
                      <span>{log.oldStatus} → {log.newStatus}</span>
                    ) : log.oldStatus ? (
                      <span className="text-red-600">-{log.oldStatus}</span>
                    ) : log.newStatus ? (
                      <span className="text-green-600">+{log.newStatus}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{log.comment || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{new Date(log.createdAt).toLocaleString("ru-RU")}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getActionColor(log.action)}`}>
                  {getActionLabel(log.action)}
                </span>
              </div>
              <div className="text-sm">{log.entityType} #{String(log.entityId).slice(0, 8)}</div>
              {log.oldStatus && log.newStatus && (
                <div className="text-sm text-gray-500 mt-1">
                  {log.oldStatus} → {log.newStatus}
                </div>
              )}
              {log.comment && (
                <div className="text-sm text-gray-400 mt-1">{log.comment}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}