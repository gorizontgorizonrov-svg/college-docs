import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getIncomingById, markExecuted, sendToArchive } from "@/actions/incoming";
import { ArrowLeft, FileText, User, Calendar, Clock, Building, CheckCircle, Archive, Eye, Download } from "lucide-react";
import { ResolutionForm } from "./ResolutionForm";

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
  if (!doc) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <p className="text-[var(--text-muted)]">Документ не найден</p>
      </div>
    );
  }

  const deadline = doc.deadline ? new Date(doc.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - new Date().getTime()) / 86400000) : null;
  const deadlineColor = daysLeft !== null
    ? daysLeft > 7 ? "text-[var(--success)]" : daysLeft > 3 ? "text-[var(--warning)]" : "text-[var(--danger)]"
    : "text-[var(--text-muted)]";

  const canAssignResolution = (session.user.role === "SIGNER" || session.user.role === "ADMIN") && doc.status === "REGISTERED";
  const isExecutor = doc.executor?.userId === session.user.id;
  const canMarkExecuted = isExecutor && (doc.status === "UNDER_RESOLUTION" || doc.status === "IN_EXECUTION");
  const canArchive = (session.user.role === "REGISTRAR" || session.user.role === "ADMIN") && doc.status !== "ARCHIVED";

  const employees = await prisma.employee.findMany({
    include: { position: true, user: true },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6 max-w-4xl">
        <Link href="/incoming" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="w-4 h-4" />
          Назад к входящим
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-1 text-xs rounded-full ${statusColors[doc.status] || "badge-neutral"}`}>
                {statusLabels[doc.status] || doc.status}
              </span>
              <span className="text-sm text-[var(--text-muted)]">№ {doc.incomingNumber}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{doc.title}</h1>
          </div>
        </div>

        <div className="card p-5 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
            <div>
              <p className="text-[var(--text-muted)]">Дата регистрации</p>
              <p className="font-medium text-[var(--text-primary)]">{new Date(doc.incomingDate).toLocaleDateString("ru-RU")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Building className="w-4 h-4 text-[var(--text-muted)]" />
            <div>
              <p className="text-[var(--text-muted)]">Отправитель</p>
              <p className="font-medium text-[var(--text-primary)]">{doc.fromOrg}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-[var(--text-muted)]" />
            <div>
              <p className="text-[var(--text-muted)]">Зарегистрировал</p>
              <p className="font-medium text-[var(--text-primary)]">
                {doc.createdBy.employee
                  ? `${doc.createdBy.employee.lastName} ${doc.createdBy.employee.firstName}`
                  : doc.createdBy.email}
              </p>
            </div>
          </div>
          {doc.outgoingNumber && (
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[var(--text-muted)]" />
              <div>
                <p className="text-[var(--text-muted)]">Исходящий</p>
                <p className="font-medium text-[var(--text-primary)]">
                  № {doc.outgoingNumber}
                  {doc.outgoingDate ? ` от ${new Date(doc.outgoingDate).toLocaleDateString("ru-RU")}` : ""}
                </p>
              </div>
            </div>
          )}
          {deadline && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
              <div>
                <p className="text-[var(--text-muted)]">Срок исполнения</p>
                <p className={`font-medium ${deadlineColor}`}>
                  {new Date(deadline).toLocaleDateString("ru-RU")}
                  {daysLeft !== null && (daysLeft > 0 ? ` (${daysLeft} дн.)` : daysLeft === 0 ? " (сегодня)" : " (просрочен)")}
                </p>
              </div>
            </div>
          )}
        </div>

        {doc.content && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Содержание</h2>
            <div className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{doc.content}</div>
          </div>
        )}

        {doc.resolution && (
          <div className="card p-5 border-l-4 border-[var(--accent)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Резолюция</h2>
            <div className="text-[var(--text-secondary)] whitespace-pre-wrap mb-3">{doc.resolution}</div>
            <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
              {doc.resolutionAuthor?.employee && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>
                    {doc.resolutionAuthor.employee.lastName} {doc.resolutionAuthor.employee.firstName}
                    {doc.resolutionAuthor.employee.position ? ` (${doc.resolutionAuthor.employee.position.name})` : ""}
                  </span>
                </div>
              )}
              {doc.executor && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>
                    Исполнитель: {doc.executor.lastName} {doc.executor.firstName}
                    {doc.executor.position ? ` — ${doc.executor.position.name}` : ""}
                  </span>
                </div>
              )}
              {doc.resolutionDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(doc.resolutionDate).toLocaleDateString("ru-RU")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {doc.status === "EXECUTED" && doc.executedAt && (
          <div className="card p-5 border-l-4 border-[var(--success)]">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[var(--success)]" />
              <div>
                <p className="text-sm text-[var(--text-muted)]">Исполнен</p>
                <p className="font-medium text-[var(--text-primary)]">{new Date(doc.executedAt).toLocaleDateString("ru-RU")}</p>
              </div>
            </div>
          </div>
        )}

        {doc.fileUrl && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Прикреплённый файл</h2>
            <div className="flex flex-wrap gap-3">
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
              >
                <Eye className="w-4 h-4" />
                Просмотреть
              </a>
              <a
                href={doc.fileUrl}
                download
                className="btn"
              >
                <Download className="w-4 h-4" />
                Скачать
              </a>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
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
                <CheckCircle className="w-4 h-4" />
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
                <Archive className="w-4 h-4" />
                Отправить в архив
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
