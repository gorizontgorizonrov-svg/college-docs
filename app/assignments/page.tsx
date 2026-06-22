import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAssignmentsList } from "@/actions/assignments";
import {
  IconPlus, IconAlertCircle, IconUser,
  IconFlag3,
} from "@tabler/icons-react";
import { ClickableRow } from "@/components/ClickableRow";

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
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
  URGENT: "Срочно",
};

const priorityColors: Record<string, string> = {
  LOW: "var(--text-muted)",
  MEDIUM: "var(--text-primary)",
  HIGH: "var(--warning)",
  URGENT: "var(--danger)",
};

function getDeadlineInfo(deadline: Date | null) {
  if (!deadline) return { color: "var(--text-muted)", daysLeft: null, isOverdue: false };
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / 86400000);
  return {
    color: daysLeft > 7 ? "var(--success)" : daysLeft > 3 ? "var(--warning)" : "var(--danger)",
    daysLeft,
    isOverdue: daysLeft < 0,
  };
}

export default async function AssignmentsPage({
  searchParams: _searchParams,
}: {
  searchParams: Promise<{ status?: string; role?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const searchParams = await _searchParams;
  const role = (searchParams.role || "executor") as "executor" | "author";
  const statusFilter = searchParams.status as any;

  const assignments = await getAssignmentsList({
    role,
    status: statusFilter,
  });

  const canCreate = session.user.role === "SIGNER" || session.user.role === "ADMIN";

  return (
    <div className="anim-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="doc-h1">Поручения</h1>
        {canCreate && (
          <Link href="/assignments/create" className="btn btn-navy">
            <IconPlus size={16} />
            Создать поручение
          </Link>
        )}
      </div>

      {/* Tabs: incoming/outgoing */}
      <div className="flex gap-2">
        <Link
          href={role === "executor" ? "/assignments" : "/assignments?role=executor"}
          className={`btn ${role === "executor" ? "btn-navy" : "btn-ghost"}`}
          style={{ fontSize: 13 }}
        >
          Мне поручено
        </Link>
        <Link
          href={role === "author" ? "/assignments" : "/assignments?role=author"}
          className={`btn ${role === "author" ? "btn-navy" : "btn-ghost"}`}
          style={{ fontSize: 13 }}
        >
          Я поручил
        </Link>
      </div>

      {assignments.length === 0 ? (
        <div className="empty-state">
          <p>Поручений нет</p>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Приоритет</th>
                <th>Заголовок</th>
                {role === "author" ? <th>Исполнитель</th> : <th>Автор</th>}
                <th>Статус</th>
                <th>Срок</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => {
                const dl = a.deadline ? new Date(a.deadline) : null;
                const { color: deadlineColor, isOverdue } = getDeadlineInfo(a.deadline);

                return (
                  <ClickableRow key={a.id} href={`/assignments/${a.id}`}
                  >
                    <td>
                      <span style={{ color: priorityColors[a.priority], fontWeight: 600, fontSize: 12 }}>
                        <IconFlag3 size={14} style={{ verticalAlign: -2 }} />
                        {" "}{priorityLabels[a.priority]}
                      </span>
                    </td>
                    <td className="font-medium" style={{ color: "var(--accent)" }}>{a.title}</td>
                    <td>
                      {role === "author" ? (
                        <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                          <IconUser size={12} style={{ verticalAlign: -1 }} />
                          {" "}{a.executor.lastName} {a.executor.firstName}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                          <IconUser size={12} style={{ verticalAlign: -1 }} />
                          {" "}{a.author.employee?.lastName} {a.author.employee?.firstName}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${statusColors[a.status] || "badge-neutral"}`}>
                        {statusLabels[a.status] || a.status}
                      </span>
                    </td>
                    <td style={{ color: deadlineColor, fontWeight: 500 }}>
                      <div className="flex items-center gap-1">
                        {isOverdue && <IconAlertCircle size={14} />}
                        {dl ? dl.toLocaleDateString("ru-RU") : "—"}
                      </div>
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
