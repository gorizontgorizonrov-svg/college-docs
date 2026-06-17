import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getIncomingById, markExecuted, sendToArchive } from "@/actions/incoming";
import { getIncomingFileAttachments } from "@/actions/files";
import { IconArrowLeft, IconFileText, IconUser, IconCalendar, IconClock, IconBuilding, IconCircleCheck, IconArchive, IconEye, IconDownload } from "@tabler/icons-react";
import { ResolutionForm } from "./ResolutionForm";
import FileDownload from "@/components/FileDownload";

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

export default async function IncomingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const doc = await getIncomingById(id);
  const fileAttachments = await getIncomingFileAttachments(id);
  if (!doc) {
    return <div className="empty-state"><p>Документ не найден</p></div>;
  }

  const deadline = doc.deadline ? new Date(doc.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - new Date().getTime()) / 86400000) : null;
  const deadlineColor = daysLeft !== null
    ? daysLeft > 7 ? "var(--success)" : daysLeft > 3 ? "var(--warning)" : "var(--danger)"
    : "var(--text-muted)";

  const canAssignResolution = (session.user.role === "SIGNER" || session.user.role === "ADMIN") && doc.status === "REGISTERED";
  const isExecutor = doc.executor?.userId === session.user.id;
  const canMarkExecuted = isExecutor && (doc.status === "UNDER_RESOLUTION" || doc.status === "IN_EXECUTION");
  const canArchive = (session.user.role === "REGISTRAR" || session.user.role === "ADMIN") && doc.status !== "ARCHIVED";

  const employees = await prisma.employee.findMany({
    include: { position: true, user: true },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="anim-fade-in space-y-4" style={{ maxWidth: 900 }}>
      <Link href="/incoming" className="btn btn-ghost" style={{ marginBottom: 0 }}>
        <IconArrowLeft size={16} />
        Назад к входящим
      </Link>

      <div className="doc-top" style={{ marginBottom: 0 }}>
        <div>
          <div className="doc-eyebrow">
            <span className={`badge ${statusColors[doc.status] || "badge-neutral"}`}>
              {statusLabels[doc.status] || doc.status}
            </span>
            <span className="doc-num">№ {doc.incomingNumber}</span>
          </div>
          <div className="doc-h1">{doc.title}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="mg">
          <div className="mf">
            <label><IconCalendar size={12} style={{ verticalAlign: -1 }} /> Дата регистрации</label>
            <span>{new Date(doc.incomingDate).toLocaleDateString("ru-RU")}</span>
          </div>
          <div className="mf">
            <label><IconBuilding size={12} style={{ verticalAlign: -1 }} /> Отправитель</label>
            <span>{doc.fromOrg}</span>
          </div>
          <div className="mf">
            <label><IconUser size={12} style={{ verticalAlign: -1 }} /> Зарегистрировал</label>
            <span>
              {doc.createdBy.employee
                ? `${doc.createdBy.employee.lastName} ${doc.createdBy.employee.firstName}`
                : doc.createdBy.email}
            </span>
          </div>
          {doc.outgoingNumber && (
            <div className="mf">
              <label><IconFileText size={12} style={{ verticalAlign: -1 }} /> Исходящий</label>
              <span>
                № {doc.outgoingNumber}
                {doc.outgoingDate ? ` от ${new Date(doc.outgoingDate).toLocaleDateString("ru-RU")}` : ""}
              </span>
            </div>
          )}
          {deadline && (
            <div className="mf">
              <label><IconClock size={12} style={{ verticalAlign: -1 }} /> Срок исполнения</label>
              <span style={{ color: deadlineColor }}>
                {new Date(deadline).toLocaleDateString("ru-RU")}
                {daysLeft !== null && (daysLeft > 0 ? ` (${daysLeft} дн.)` : daysLeft === 0 ? " (сегодня)" : " (просрочен)")}
              </span>
            </div>
          )}
        </div>
      </div>

      {doc.content && (
        <div className="card">
          <div className="ch"><div className="ch-l"><IconFileText size={14} />Содержание</div></div>
          <div className="cb">
            <div style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {doc.content}
            </div>
          </div>
        </div>
      )}

      {doc.resolution && (
        <div className="card" style={{ borderLeft: "4px solid var(--accent)" }}>
          <div className="ch"><div className="ch-l"><IconFileText size={14} />Резолюция</div></div>
          <div className="cb">
            <div style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "pre-wrap", marginBottom: 12 }}>
              {doc.resolution}
            </div>
            <div className="mg">
              {doc.resolutionAuthor?.employee && (
                <div className="mf">
                  <label><IconUser size={12} style={{ verticalAlign: -1 }} /> Автор</label>
                  <span>
                    {doc.resolutionAuthor.employee.lastName} {doc.resolutionAuthor.employee.firstName}
                    {doc.resolutionAuthor.employee.position ? ` (${doc.resolutionAuthor.employee.position.name})` : ""}
                  </span>
                </div>
              )}
              {doc.executor && (
                <div className="mf">
                  <label><IconUser size={12} style={{ verticalAlign: -1 }} /> Исполнитель</label>
                  <span>
                    {doc.executor.lastName} {doc.executor.firstName}
                    {doc.executor.position ? ` — ${doc.executor.position.name}` : ""}
                  </span>
                </div>
              )}
              {doc.resolutionDate && (
                <div className="mf">
                  <label><IconCalendar size={12} style={{ verticalAlign: -1 }} /> Дата</label>
                  <span>{new Date(doc.resolutionDate).toLocaleDateString("ru-RU")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {doc.status === "EXECUTED" && doc.executedAt && (
        <div className="card" style={{ borderLeft: "4px solid var(--success)", padding: 16 }}>
          <div className="flex items-center gap-3">
            <IconCircleCheck size={20} style={{ color: "var(--success)" }} />
            <div>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Исполнен</p>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                {new Date(doc.executedAt).toLocaleDateString("ru-RU")}
              </p>
            </div>
          </div>
        </div>
      )}

      {(fileAttachments.length > 0 || doc.fileUrl) && (
        <div className="card">
          <div className="ch"><div className="ch-l"><IconFileText size={14} />Прикреплённые файлы</div></div>
          <div className="cb" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {doc.fileUrl && (
              <div className="file-link" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", cursor: "default" }}>
                <IconFileText size={20} style={{ color: "var(--accent)", flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 13, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {doc.fileUrl.split("/").pop()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link" title="Просмотреть">
                    <IconEye size={14} />
                  </a>
                  <a href={doc.fileUrl} download className="file-link" title="Скачать">
                    <IconDownload size={14} />
                  </a>
                </div>
              </div>
            )}
            {fileAttachments.map((file) => (
              <FileDownload key={file.id} file={file} showPreview={true} />
            ))}
            {fileAttachments.length > 1 && (
              <form action="/api/download-zip" method="POST" target="_blank">
                <button type="submit" className="btn" style={{ width: "100%", justifyContent: "center", borderStyle: "dashed" }}>
                  <IconDownload size={16} />Скачать все файлы ZIP
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="act-row">
        {canAssignResolution && (
          <ResolutionForm documentId={id} employees={employees} />
        )}
        {canMarkExecuted && (
          <form action={async () => {
            "use server";
            await markExecuted(id);
            redirect("/incoming");
          }}>
            <button type="submit" className="btn btn-navy">
              <IconCircleCheck size={16} />
              Отметить исполненным
            </button>
          </form>
        )}
        {canArchive && (
          <form action={async () => {
            "use server";
            await sendToArchive(id);
            redirect("/incoming");
          }}>
            <button type="submit" className="btn">
              <IconArchive size={16} />
              Отправить в архив
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
