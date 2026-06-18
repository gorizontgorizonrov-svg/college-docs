import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getMyDocuments } from "@/actions/documents";
import { IconPlus, IconFileText, IconDownload, IconEye, IconX } from "@tabler/icons-react";
import { ClickableRow } from "@/components/ClickableRow";
import type { DocumentStatus, InternalDocType } from "@prisma/client";

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

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { status, type } = await searchParams;
  const documents = await getMyDocuments(session.user.id, {
    status: (status as DocumentStatus) || undefined,
    type: (type as InternalDocType) || undefined,
  });

  return (
    <div className="anim-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="doc-h1">Мои документы</h1>
        <Link href="/documents/create" className="btn btn-navy">
          <IconPlus size={16} />
          Создать
        </Link>
      </div>

      {(status || type) && (
        <div className="flex items-center gap-2 flex-wrap">
          {status && (
            <Link href="/documents" className="btn btn-ghost" style={{ fontSize: 11, padding: "3px 10px" }}>
              {statusLabels[status] || status}
              <IconX size={12} />
            </Link>
          )}
          {type && (
            <Link href="/documents" className="btn btn-ghost" style={{ fontSize: 11, padding: "3px 10px" }}>
              {typeLabels[type] || type}
              <IconX size={12} />
            </Link>
          )}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="empty-state">
          <IconFileText size={32} style={{ color: "var(--text-muted)", marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
