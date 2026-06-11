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
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Мои документы</h1>
          <Link href="/documents/create" className="btn btn-navy">
            <Plus className="w-4 h-4" />
            Создать
          </Link>
        </div>

        {documents.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-muted)] text-lg mb-4">У вас пока нет документов</p>
            <Link href="/documents/create" className="btn btn-navy">
              Создать первый документ
            </Link>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className=" border-b border-[var(--border-subtle)]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Номер</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Тип</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Название</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Статус</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Дата</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Файл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {documents.map((doc) => (
                    <ClickableRow key={doc.id} href={`/documents/${doc.id}`} className="hover:bg-[var(--bg-secondary)]">
                      <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{doc.number || "—"}</td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{typeLabels[doc.type] || doc.type}</td>
                      <td className="px-4 py-3 font-medium text-[var(--accent)]">{doc.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[doc.status] || "badge-neutral"}`}>
                          {statusLabels[doc.status] || doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                        {new Date(doc.createdAt).toLocaleDateString("ru-RU")}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
