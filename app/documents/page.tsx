import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getMyDocuments } from "@/actions/documents";
import { Plus, FileText, Download, Eye } from "lucide-react";
import { ClickableRow } from "@/components/ClickableRow";

const statusLabels: Record<string, string> = {
  DRAFT: "Черновик",
  IN_APPROVAL: "На согласовании",
  APPROVED: "Утверждён",
  REJECTED: "Отклонён",
  ARCHIVED: "В архиве",
};

const statusColors: Record<string, string> = {
  DRAFT: "badge-neutral",
  IN_APPROVAL: "badge-warning",
  APPROVED: "badge-success",
  REJECTED: "badge-danger",
  ARCHIVED: "badge-info",
};

const typeLabels: Record<string, string> = {
  ORDER: "Приказ",
  DIRECTIVE: "Распоряжение",
  PROTOCOL: "Протокол",
  ACT: "Акт",
  MEMO: "Служебная записка",
  CONTRACT: "Договор",
  REPORT: "Отчёт",
};

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const documents = await getMyDocuments(session.user.id);

  return (
    <div className="anim-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="doc-h1">Мои документы</h1>
        <Link href="/documents/create" className="btn btn-navy">
          <Plus size={16} />
          Создать
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          <FileText size={32} style={{ color: "var(--text-muted)", marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
          <p>У вас пока нет документов</p>
          <Link href="/documents/create" className="btn btn-navy" style={{ marginTop: 16 }}>
            Создать первый документ
          </Link>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Номер</th>
                <th>Тип</th>
                <th>Название</th>
                <th>Статус</th>
                <th>Дата</th>
                <th>Файл</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <ClickableRow key={doc.id} href={`/documents/${doc.id}`}>
                  <td>{doc.number || "—"}</td>
                  <td>{typeLabels[doc.type] || doc.type}</td>
                  <td className="font-medium" style={{ color: "var(--accent)" }}>{doc.title}</td>
                  <td>
                    <span className={`badge ${statusColors[doc.status] || "badge-neutral"}`}>
                      {statusLabels[doc.status] || doc.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {new Date(doc.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td>
                    {doc.fileUrl ? (
                      <div className="flex gap-2">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link" title="Просмотреть">
                          <Eye size={14} />
                        </a>
                        <a href={doc.fileUrl} download className="file-link" title="Скачать">
                          <Download size={14} />
                        </a>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
