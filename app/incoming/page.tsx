import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getIncomingList } from "@/actions/incoming";
import { IconPlus, IconAlertCircle, IconEye, IconDownload } from "@tabler/icons-react";
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
  if (!deadline) return { color: "var(--text-muted)", daysLeft: null, isOverdue: false };
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / 86400000);
  const isOverdue = daysLeft < 0;
  const color = daysLeft > 7 ? "var(--success)"
    : daysLeft > 3 ? "var(--warning)"
    : "var(--danger)";
  return { color, daysLeft, isOverdue };
}

export default async function IncomingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const docs = await getIncomingList();

  return (
    <div className="anim-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="doc-h1">Входящие документы</h1>
        {(session.user.role === "REGISTRAR" || session.user.role === "ADMIN") && (
          <Link href="/incoming/register" className="btn btn-navy">
            <IconPlus size={16} />
            Зарегистрировать
          </Link>
        )}
      </div>

      {docs.length === 0 ? (
        <div className="empty-state">
          <p>Входящих документов нет</p>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Дата</th>
                <th>От кого</th>
                <th>Заголовок</th>
                <th>Статус</th>
                <th>Срок</th>
                <th>Файл</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const dl = doc.deadline ? new Date(doc.deadline) : null;
                const { color: deadlineColor, isOverdue } = getDeadlineInfo(doc.deadline);

                return (
                  <ClickableRow key={doc.id} href={`/incoming/${doc.id}`}
                    className={isOverdue ? "border-l-4" : ""}>
                    <td style={{ color: "var(--text-muted)" }}>{doc.incomingNumber}</td>
                    <td>{new Date(doc.incomingDate).toLocaleDateString("ru-RU")}</td>
                    <td>{doc.fromOrg}</td>
                    <td className="font-medium" style={{ color: "var(--accent)" }}>{doc.title}</td>
                    <td>
                      <span className={`badge ${statusColors[doc.status] || "badge-neutral"}`}>
                        {statusLabels[doc.status] || doc.status}
                      </span>
                    </td>
                    <td style={{ color: deadlineColor, fontWeight: 500 }}>
                      <div className="flex items-center gap-1">
                        {isOverdue && <IconAlertCircle size={14} />}
                        {dl ? dl.toLocaleDateString("ru-RU") : "—"}
                      </div>
                    </td>
                    <td>
                      {doc.fileUrl ? (
                        <div className="flex gap-2">
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link" title="Просмотреть">
                            <IconEye size={14} />
                          </a>
                          <a href={doc.fileUrl} download className="file-link" title="Скачать">
                            <IconDownload size={14} />
                          </a>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                  </ClickableRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
