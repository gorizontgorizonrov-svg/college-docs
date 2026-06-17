import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { IconSearch, IconChevronLeft, IconChevronRight, IconEye, IconDownload } from "@tabler/icons-react";
import { ClickableRow } from "@/components/ClickableRow";

const statusLabels: Record<string, string> = {
  DRAFT: "Черновик",
  IN_APPROVAL: "На согласовании",
  APPROVED: "Утверждён",
  REJECTED: "Отклонён",
  ARCHIVED: "В архиве",
};

const typeLabels: Record<string, string> = {
  ORDER: "Приказ", DIRECTIVE: "Распоряжение", PROTOCOL: "Протокол",
  ACT: "Акт", MEMO: "Служебная записка", CONTRACT: "Договор", REPORT: "Отчёт",
};

const statusColors: Record<string, string> = {
  APPROVED: "badge-success", REJECTED: "badge-danger",
  IN_APPROVAL: "badge-warning", ARCHIVED: "badge-info",
  DRAFT: "badge-neutral",
};

const PAGE_SIZE = 20;

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; status?: string; dateFrom?: string; dateTo?: string; number?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const offset = (page - 1) * PAGE_SIZE;

  const where: any = {};

  if (params.search) where.title = { contains: params.search, mode: "insensitive" };
  if (params.number) where.number = { contains: params.number, mode: "insensitive" };
  if (params.type) where.type = params.type;
  if (params.status) where.status = params.status;
  if (params.dateFrom) where.createdAt = { ...(where.createdAt || {}), gte: new Date(params.dateFrom) };
  if (params.dateTo) where.createdAt = { ...(where.createdAt || {}), lte: new Date(params.dateTo + "T23:59:59.999Z") };

  if (session.user.role !== "ADMIN") {
    where.OR = [
      { authorId: session.user.id },
      { approvals: { some: { approverId: session.user.id } } },
    ];
  }

  let documents: any[] = [];
  try {
    const result = await prisma.internalDocument.findMany({
      where,
      include: { author: { include: { employee: true } } },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: PAGE_SIZE,
    });
    documents = result;
  } catch {
    documents = await prisma.internalDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: PAGE_SIZE,
    });
  }
  const total = await prisma.internalDocument.count({ where });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.number) q.set("number", params.number);
    if (params.type) q.set("type", params.type);
    if (params.status) q.set("status", params.status);
    if (params.dateFrom) q.set("dateFrom", params.dateFrom);
    if (params.dateTo) q.set("dateTo", params.dateTo);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) q.set(k, v);
      else q.delete(k);
    });
    return `?${q.toString()}`;
  };

  return (
    <div className="anim-fade-in space-y-4">
      <h1 className="doc-h1">Архив документов</h1>

      <form className="flex flex-col md:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input name="search" defaultValue={params.search || ""} className="input pl-10" placeholder="Поиск по названию..." />
        </div>
        <input name="number" defaultValue={params.number || ""} className="input md:w-40" placeholder="Номер документа" />
        <select name="type" defaultValue={params.type || ""} className="select md:w-44">
          <option value="">Все типы</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="status" defaultValue={params.status || ""} className="select md:w-44">
          <option value="">Все статусы</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input name="dateFrom" type="date" defaultValue={params.dateFrom || ""} className="input md:w-40" placeholder="Дата с" />
        <input name="dateTo" type="date" defaultValue={params.dateTo || ""} className="input md:w-40" placeholder="Дата по" />
        <button type="submit" className="btn">Поиск</button>
      </form>

      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Найдено: {total}</p>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Номер</th>
              <th>Тип</th>
              <th>Название</th>
              <th>Автор</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Файл</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <ClickableRow key={doc.id} href={`/documents/${doc.id}`}>
                <td style={{ color: "var(--text-muted)" }}>{doc.number || "—"}</td>
                <td>{typeLabels[doc.type] || doc.type}</td>
                <td className="font-medium" style={{ color: "var(--accent)" }}>{doc.title}</td>
                <td>
                  {doc.author?.employee ? `${doc.author.employee.lastName} ${doc.author.employee.firstName}` : "—"}
                </td>
                <td>
                  <span className={`badge ${statusColors[doc.status] || "badge-neutral"}`}>
                    {statusLabels[doc.status] || doc.status}
                  </span>
                </td>
                <td style={{ color: "var(--text-muted)" }}>{new Date(doc.createdAt).toLocaleDateString("ru-RU")}</td>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          {page > 1 ? (
            <Link href={buildQuery({ page: String(page - 1) })} className="btn">
              <IconChevronLeft size={16} />
              Назад
            </Link>
          ) : (
            <span className="btn opacity-50 cursor-not-allowed">
              <IconChevronLeft size={16} />
              Назад
            </span>
          )}
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Страница {page} из {totalPages}</span>
          {page < totalPages ? (
            <Link href={buildQuery({ page: String(page + 1) })} className="btn">
              Вперёд
              <IconChevronRight size={16} />
            </Link>
          ) : (
            <span className="btn opacity-50 cursor-not-allowed">
              Вперёд
              <IconChevronRight size={16} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
