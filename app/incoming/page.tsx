import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getIncomingList } from "@/actions/incoming";
import { Plus, AlertCircle, Eye, Download } from "lucide-react";
import { ClickableRow } from "@/components/ClickableRow";

const statusLabels: Record<string, string> = {
  REGISTERED: "Зарегистрирован",
  UNDER_RESOLUTION: "На резолюции",
  IN_EXECUTION: "На исполнении",
  EXECUTED: "Исполнен",
  ARCHIVED: "В архиве",
};

const statusColors: Record<string, string> = {
  REGISTERED: "badge-info",
  UNDER_RESOLUTION: "badge-warning",
  IN_EXECUTION: "badge-warning",
  EXECUTED: "badge-success",
  ARCHIVED: "badge-neutral",
};

function getDeadlineInfo(deadline: Date | null): { color: string; daysLeft: number | null; isOverdue: boolean } {
  if (!deadline) return { color: "text-[var(--text-muted)]", daysLeft: null, isOverdue: false };
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / 86400000);
  const isOverdue = daysLeft < 0;
  const color = daysLeft > 7 ? "text-[var(--success)]"
    : daysLeft > 3 ? "text-[var(--warning)]"
    : "text-[var(--danger)]";
  return { color, daysLeft, isOverdue };
}

export default async function IncomingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const docs = await getIncomingList();

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Входящие документы</h1>
          {(session.user.role === "REGISTRAR" || session.user.role === "ADMIN") && (
            <Link href="/incoming/register" className="btn btn-navy">
              <Plus className="w-4 h-4" />
              Зарегистрировать
            </Link>
          )}
        </div>

        {docs.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-[var(--text-muted)]">Входящих документов нет</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className=" border-b border-[var(--border-subtle)]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">№</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Дата</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">От кого</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Заголовок</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Статус</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Срок</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Файл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {docs.map((doc) => {
                    const deadline = doc.deadline ? new Date(doc.deadline) : null;
                    const { color: deadlineColor, isOverdue } = getDeadlineInfo(doc.deadline);

                    return (
                      <ClickableRow key={doc.id} href={`/incoming/${doc.id}`}
                        className={`hover:bg-[var(--bg-secondary)] ${isOverdue ? "opacity-80 border-l-4 border-l-[var(--danger)]" : ""}`}>
                        <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{doc.incomingNumber}</td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                          {new Date(doc.incomingDate).toLocaleDateString("ru-RU")}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{doc.fromOrg}</td>
                        <td className="px-4 py-3 font-medium text-[var(--accent)]">{doc.title}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[doc.status] || "badge-neutral"}`}>
                            {statusLabels[doc.status] || doc.status}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium ${deadlineColor}`}>
                          <div className="flex items-center gap-1">
                            {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
                            {deadline ? deadline.toLocaleDateString("ru-RU") : "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {doc.fileUrl ? (
                            <div className="flex gap-2">
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link text-xs" title="Просмотреть">
                                <Eye className="w-3.5 h-3.5" />
                              </a>
                              <a href={doc.fileUrl} download className="file-link text-xs" title="Скачать">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                      </ClickableRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
