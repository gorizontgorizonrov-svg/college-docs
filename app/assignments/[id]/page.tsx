import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  getAssignmentById, getTaskChildren, getTaskHierarchy,
  updateAssignmentStatus, submitReport, confirmCompletion, reviseAssignment,
  createAssignment,
} from "@/actions/assignments";
import {
  IconArrowLeft, IconUser, IconCalendar, IconFlag3,
  IconClock, IconCircleCheck, IconX, IconListTree,
  IconPlayerPlayFilled, IconSend, IconChecks, IconRefresh,
  IconPlus, IconSubtask,
} from "@tabler/icons-react";

const statusLabels: Record<string, string> = {
  PENDING: "Ожидает",
  IN_PROGRESS: "В работе",
  REPORTED: "На проверке",
  COMPLETED: "Выполнено",
  OVERDUE: "Просрочено",
  CANCELLED: "Отменено",
};

const statusColors: Record<string, string> = {
  PENDING: "badge-info",
  IN_PROGRESS: "badge-warning",
  REPORTED: "badge-purple",
  COMPLETED: "badge-success",
  OVERDUE: "badge-error",
  CANCELLED: "badge-neutral",
};

const priorityLabels: Record<string, string> = {
  LOW: "Низкий", MEDIUM: "Средний", HIGH: "Высокий", URGENT: "Срочно",
};

const priorityColors: Record<string, string> = {
  LOW: "var(--text-muted)", MEDIUM: "var(--text-primary)",
  HIGH: "var(--warning)", URGENT: "var(--danger)",
};

export default async function AssignmentDetailPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const assignment = await getAssignmentById(id);
  if (!assignment) {
    return <div className="empty-state"><p>Поручение не найдено</p></div>;
  }

  const children = await getTaskChildren(id);
  const hierarchy = await getTaskHierarchy(id);

  const deadline = assignment.deadline ? new Date(assignment.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - new Date().getTime()) / 86400000) : null;
  const deadlineColor = daysLeft !== null
    ? daysLeft > 7 ? "var(--success)" : daysLeft > 3 ? "var(--warning)" : "var(--danger)"
    : "var(--text-muted)";

  const emp = await prisma.employee.findUnique({ where: { userId: session.user.id } });
  const isExecutor = emp && assignment.executorId === emp.id;
  const isAuthor = assignment.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const canCreate = session.user.role === "SIGNER" || session.user.role === "ADMIN";

  const canStart = isExecutor && assignment.status === "PENDING";
  const canReport = isExecutor && assignment.status === "IN_PROGRESS";
  const canConfirm = (isAuthor || isAdmin) && assignment.status === "REPORTED";
  const canCancel = (isAuthor || isAdmin) && ["PENDING", "IN_PROGRESS"].includes(assignment.status);

  return (
    <div className="anim-fade-in space-y-4" style={{ maxWidth: 900 }}>
      <Link href="/assignments" className="btn btn-ghost" style={{ marginBottom: 0 }}>
        <IconArrowLeft size={16} />
        Назад к поручениям
      </Link>

      {/* Breadcrumbs */}
      {assignment.parent && (
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          <Link href={`/assignments/${assignment.parent.id}`} style={{ color: "var(--accent)" }}>
            {assignment.parent.title}
          </Link>
          {" / "}
          <span style={{ color: "var(--text-secondary)" }}>{assignment.title}</span>
        </div>
      )}

      <div className="doc-top" style={{ marginBottom: 0 }}>
        <div>
          <div className="doc-eyebrow">
            <span className={`badge ${statusColors[assignment.status] || "badge-neutral"}`}>
              {statusLabels[assignment.status] || assignment.status}
            </span>
            <span style={{
              color: priorityColors[assignment.priority],
              fontWeight: 600, fontSize: 12, marginLeft: 8,
            }}>
              <IconFlag3 size={14} style={{ verticalAlign: -2 }} /> {priorityLabels[assignment.priority]}
            </span>
            {assignment.parentId && (
              <span style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: 12 }}>
                <IconSubtask size={14} style={{ verticalAlign: -2 }} /> Подзадача
              </span>
            )}
          </div>
          <div className="doc-h1">{assignment.title}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="mg">
          <div className="mf">
            <label><IconUser size={12} style={{ verticalAlign: -1 }} /> Автор</label>
            <span>
              {assignment.author.employee
                ? `${assignment.author.employee.lastName} ${assignment.author.employee.firstName}`
                : assignment.author.email}
            </span>
          </div>
          <div className="mf">
            <label><IconUser size={12} style={{ verticalAlign: -1 }} /> Исполнитель</label>
            <span>
              {assignment.executor.lastName} {assignment.executor.firstName}
              {assignment.executor.position ? ` — ${assignment.executor.position.name}` : ""}
            </span>
          </div>
          <div className="mf">
            <label><IconCalendar size={12} style={{ verticalAlign: -1 }} /> Создано</label>
            <span>{new Date(assignment.createdAt).toLocaleDateString("ru-RU")}</span>
          </div>
          {deadline && (
            <div className="mf">
              <label><IconClock size={12} style={{ verticalAlign: -1 }} /> Срок</label>
              <span style={{ color: deadlineColor }}>
                {deadline.toLocaleDateString("ru-RU")}
                {daysLeft !== null && (daysLeft > 0 ? ` (${daysLeft} дн.)` : daysLeft === 0 ? " (сегодня)" : " (просрочен)")}
              </span>
            </div>
          )}
          {assignment.completedAt && (
            <div className="mf">
              <label><IconCircleCheck size={12} style={{ verticalAlign: -1 }} /> Выполнено</label>
              <span>{new Date(assignment.completedAt).toLocaleDateString("ru-RU")}</span>
            </div>
          )}
        </div>
      </div>

      {assignment.description && (
        <div className="card">
          <div className="ch"><div className="ch-l"><IconFlag3 size={14} />Описание</div></div>
          <div className="cb">
            <div style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {assignment.description}
            </div>
          </div>
        </div>
      )}

      {/* Subtask progress */}
      {children.length > 0 && (
        <div className="card">
          <div className="ch"><div className="ch-l"><IconListTree size={14} />Подзадачи</div></div>
          <div className="cb" style={{ paddingTop: 0 }}>
            {hierarchy && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                  <span>Прогресс: {hierarchy.progress}%</span>
                  <span>{children.filter(c => c.status === "COMPLETED").length}/{children.length}</span>
                </div>
                <div style={{ height: 6, background: "var(--bg-subtle)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${hierarchy.progress}%`, height: "100%", background: "var(--success)", borderRadius: 3, transition: "width 0.3s" }} />
                </div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/assignments/${child.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", borderRadius: 8,
                    background: "var(--bg-subtle)", textDecoration: "none",
                    fontSize: 13,
                  }}
                >
                  <span className={`badge ${statusColors[child.status]}`} style={{ fontSize: 10, padding: "1px 6px" }}>
                    {statusLabels[child.status]}
                  </span>
                  <span style={{ color: "var(--text-primary)" }}>{child.title}</span>
                  <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 12 }}>
                    {child.executor.lastName} {child.executor.firstName}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create subtask form */}
      {canCreate && ["PENDING", "IN_PROGRESS"].includes(assignment.status) && (
        <details style={{ cursor: "pointer" }}>
          <summary className="btn btn-ghost" style={{ display: "inline-flex", gap: 6, fontSize: 13 }}>
            <IconPlus size={14} />
            Создать подзадачу
          </summary>
          <form
            action={async (formData: FormData) => {
              "use server";
              const title = formData.get("title") as string;
              const executorId = formData.get("executorId") as string;
              const priority = formData.get("priority") as string;
              const deadline = formData.get("deadline") as string;
              const description = formData.get("description") as string;
              if (title && executorId) {
                await createAssignment({
                  title,
                  executorId,
                  priority: priority || "MEDIUM",
                  deadline: deadline || undefined,
                  description: description || undefined,
                  parentId: id,
                });
              }
              redirect(`/assignments/${id}`);
            }}
            style={{ cursor: "default", marginTop: 8, display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "var(--bg-subtle)", borderRadius: 12 }}
          >
            <input name="title" placeholder="Название подзадачи" className="input" required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <select name="executorId" className="input" required>
                <option value="">Исполнитель</option>
                {(await prisma.employee.findMany({ include: { position: true, user: true }, orderBy: { lastName: "asc" } })).map((e) => (
                  <option key={e.id} value={e.id}>{e.lastName} {e.firstName} — {e.position?.name}</option>
                ))}
              </select>
              <select name="priority" className="input" defaultValue="MEDIUM">
                <option value="LOW">Низкий</option>
                <option value="MEDIUM">Средний</option>
                <option value="HIGH">Высокий</option>
                <option value="URGENT">Срочно</option>
              </select>
            </div>
            <input name="deadline" type="date" className="input" placeholder="Срок" />
            <textarea name="description" className="input" rows={3} placeholder="Описание..." />
            <button type="submit" className="btn btn-navy" style={{ alignSelf: "flex-start" }}>
              <IconPlus size={14} />
              Создать
            </button>
          </form>
        </details>
      )}

      {assignment.document && (
        <div className="card" style={{ borderLeft: "4px solid var(--accent)" }}>
          <div className="ch"><div className="ch-l">Связанный документ</div></div>
          <div className="cb">
            <Link href={`/documents/${assignment.document.id}`} style={{ color: "var(--accent)" }}>
              {assignment.document.title} ({assignment.document.number || "без номера"})
            </Link>
          </div>
        </div>
      )}

      {assignment.incoming && (
        <div className="card" style={{ borderLeft: "4px solid var(--accent)" }}>
          <div className="ch"><div className="ch-l">Связанный входящий документ</div></div>
          <div className="cb">
            <Link href={`/incoming/${assignment.incoming.id}`} style={{ color: "var(--accent)" }}>
              {assignment.incoming.title} (№ {assignment.incoming.incomingNumber})
            </Link>
          </div>
        </div>
      )}

      {/* Executor report section */}
      {assignment.report && (
        <div className="card" style={{ borderLeft: "4px solid var(--accent)" }}>
          <div className="ch"><div className="ch-l"><IconSend size={14} />Отчёт исполнителя</div></div>
          <div className="cb">
            <div style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {assignment.report}
            </div>
          </div>
        </div>
      )}

      {/* Report form (executor, IN_PROGRESS) */}
      {canReport && (
        <div className="card" style={{ borderLeft: "4px solid var(--warning)" }}>
          <div className="ch"><div className="ch-l"><IconSend size={14} />Отчитаться о выполнении</div></div>
          <div className="cb">
            <form action={async (formData: FormData) => {
              "use server";
              const report = formData.get("report") as string;
              if (report) await submitReport(id, report);
              redirect(`/assignments/${id}`);
            }}>
              <textarea
                name="report"
                className="input"
                rows={5}
                placeholder="Опишите, что сделано, приложите ссылки на документы..."
                required
              />
              <button type="submit" className="btn btn-navy" style={{ marginTop: 8 }}>
                <IconSend size={14} />
                Отправить отчёт
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="act-row">
        {canStart && (
          <form action={async () => {
            "use server";
            await updateAssignmentStatus(id, "IN_PROGRESS");
            redirect(`/assignments/${id}`);
          }}>
            <button type="submit" className="btn btn-navy">
              <IconPlayerPlayFilled size={16} />
              Принять к исполнению
            </button>
          </form>
        )}
        {canConfirm && (
          <>
            <form action={async () => {
              "use server";
              await confirmCompletion(id);
              redirect(`/assignments/${id}`);
            }}>
              <button type="submit" className="btn btn-success">
                <IconChecks size={16} />
                Подтвердить выполнение
              </button>
            </form>
            <details style={{ cursor: "pointer", display: "inline-block" }}>
              <summary className="btn" style={{ display: "inline-flex", gap: 6 }}>
                <IconRefresh size={16} />
                Вернуть на доработку
              </summary>
              <form action={async (formData: FormData) => {
                "use server";
                const comment = formData.get("comment") as string;
                await reviseAssignment(id, comment || "На доработку");
                redirect(`/assignments/${id}`);
              }} style={{ cursor: "default", marginTop: 8, display: "flex", gap: 8, flexDirection: "column" }}>
                <textarea name="comment" className="input" rows={3} placeholder="Что нужно доработать?" required />
                <button type="submit" className="btn" style={{ alignSelf: "flex-start" }}>
                  <IconRefresh size={14} />
                  Вернуть
                </button>
              </form>
            </details>
          </>
        )}
        {canCancel && (
          <form action={async () => {
            "use server";
            await updateAssignmentStatus(id, "CANCELLED");
            redirect("/assignments");
          }}>
            <button type="submit" className="btn">
              <IconX size={16} />
              Отменить
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
