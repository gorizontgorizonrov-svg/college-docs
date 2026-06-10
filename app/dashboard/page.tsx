import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDashboardStats, getActivityFeed } from "@/actions/dashboard";
import { prisma } from "@/lib/prisma";
import {
  FileText, Send, CheckCircle, Clock, AlertCircle, Plus, ArrowRight,
  History, Timer, User, Inbox, Archive, List,
  Shield, Bell, Users, BarChart3,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  DRAFT: "Черновик", IN_APPROVAL: "На согласовании", APPROVED: "Утверждён",
  REJECTED: "Отклонён", ARCHIVED: "В архиве",
};

const typeLabels: Record<string, string> = {
  ORDER: "Приказ", DIRECTIVE: "Распоряжение", PROTOCOL: "Протокол",
  ACT: "Акт", MEMO: "Служебная записка", CONTRACT: "Договор", REPORT: "Отчёт",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  IN_APPROVAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ARCHIVED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [stats, activity, employee] = await Promise.all([
    getDashboardStats(session.user.id),
    getActivityFeed(session.user.id),
    prisma.employee.findUnique({
      where: { userId: session.user.id },
      include: { position: true, department: true },
    }),
  ]);

  const role = session.user.role;

  const overdueApprovals = (role === "VALIDATOR" || role === "SIGNER" || role === "ADMIN")
    ? await prisma.documentApproval.findMany({
        where: { approverId: session.user.id, decision: null, document: { status: "IN_APPROVAL" } },
        include: { document: { include: { author: { include: { employee: true } } } }, stage: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const myInProgress = (role === "INITIATOR" || role === "ADMIN")
    ? await prisma.internalDocument.findMany({
        where: { authorId: session.user.id, status: { in: ["DRAFT", "IN_APPROVAL", "APPROVED"] } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      })
    : [];

  const recentDocs = await prisma.internalDocument.findMany({
    where: role === "ADMIN" ? {} : { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { author: { include: { employee: true } } },
  });

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Приветствие */}
        <div className="card p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                <User className="w-7 h-7 text-[var(--accent)]" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                  {employee
                    ? `${employee.firstName} ${employee.lastName}`
                    : "Добро пожаловать"}
                </h1>
                <p className="text-sm text-[var(--text-muted)]">
                  {employee?.position?.name && `${employee.position.name} · `}
                  {employee?.department?.name && `${employee.department.name} · `}
                  {role === "INITIATOR" && "Создавайте и отправляйте документы"}
                  {role === "VALIDATOR" && "Проверяйте и согласовывайте документы"}
                  {role === "SIGNER" && "Подписывайте и утверждайте документы"}
                  {role === "REGISTRAR" && "Регистрируйте входящие и управляйте архивом"}
                  {role === "ADMIN" && "Управляйте системой и сотрудниками"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {(role === "INITIATOR" || role === "ADMIN" || role === "VALIDATOR") && (
                <Link href="/documents/create" className="btn btn-navy">
                  <Plus className="w-4 h-4" />
                  Создать
                </Link>
              )}
              <Link href="/profile" className="btn">
                <User className="w-4 h-4" />
                Профиль
              </Link>
            </div>
          </div>

          {/* Быстрые действия */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Link href="/documents" className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 transition-colors">
              <FileText className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Документы</span>
            </Link>
            <Link href="/incoming" className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 transition-colors">
              <Inbox className="w-5 h-5 text-purple-400 shrink-0" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Входящие</span>
            </Link>
            <Link href="/archive" className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 transition-colors">
              <Archive className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Архив</span>
            </Link>
            <Link href="/documents/pending" className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 transition-colors">
              <List className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-sm font-medium text-[var(--text-primary)]">На подписи</span>
            </Link>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-[var(--text-muted)]">Всего</span>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalDocuments}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-sm text-[var(--text-muted)]">Черновики</span>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.draftDocuments}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-[var(--text-muted)]">На согласовании</span>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.inApproval}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-[var(--text-muted)]">Утверждено</span>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.approved}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ролевая секция */}
          <div className="space-y-4">
            {/* Для INITIATOR */}
            {role === "INITIATOR" && (
              <>
                {myInProgress.length > 0 && (
                  <div className="card p-5">
                    <h2 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--accent)]" />
                      Мои документы в работе
                    </h2>
                    <div className="space-y-2">
                      {myInProgress.map((doc) => (
                        <Link key={doc.id} href={`/documents/${doc.id}`}
                          className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{doc.title}</p>
                            <p className="text-xs text-[var(--text-muted)]">{typeLabels[doc.type] || doc.type}</p>
                          </div>
                          <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ml-2 ${
                            doc.status === "APPROVED" ? statusColors.APPROVED : doc.status === "IN_APPROVAL" ? statusColors.IN_APPROVAL : statusColors.DRAFT
                          }`}>
                            {statusLabels[doc.status] || doc.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <Link href="/documents" className="text-sm text-[var(--accent)] hover:underline mt-3 inline-block">
                      Все документы →
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Для VALIDATOR / SIGNER */}
            {(role === "VALIDATOR" || role === "SIGNER") && (
              <>
                <Link href="/documents/pending" className="card p-5 flex items-center justify-between group hover:border-purple-500/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Ожидают решения</p>
                      <p className="text-sm text-[var(--text-muted)]">{stats.pendingApprovals} документов</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
                </Link>

                {overdueApprovals.filter((a) => {
                  const deadline = a.stage?.deadlineDays ? new Date(a.document.createdAt) : null;
                  if (!deadline) return false;
                  deadline.setDate(deadline.getDate() + a.stage!.deadlineDays!);
                  return deadline < new Date();
                }).length > 0 && (
                  <div className="card p-5 border border-[var(--danger)]/30">
                    <div className="flex items-center gap-3 mb-3">
                      <Timer className="w-5 h-5 text-[var(--danger)]" />
                      <h2 className="font-semibold text-[var(--text-primary)]">Просроченные документы</h2>
                    </div>
                    <div className="space-y-2">
                      {overdueApprovals.filter((a) => {
                        const deadline = a.stage?.deadlineDays ? new Date(a.document.createdAt) : null;
                        if (!deadline) return false;
                        deadline.setDate(deadline.getDate() + a.stage!.deadlineDays!);
                        return deadline < new Date();
                      }).slice(0, 5).map((a) => (
                        <Link key={a.id} href={`/documents/${a.document.id}`}
                          className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80">
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">{a.document.title}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {a.document.author.employee
                                ? `${a.document.author.employee.lastName} ${a.document.author.employee.firstName}`
                                : ""}
                            </p>
                          </div>
                          <span className="text-xs text-[var(--danger)] font-medium shrink-0">Просрочено</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Для REGISTRAR */}
            {role === "REGISTRAR" && (
              <div className="card p-5">
                <h2 className="font-semibold text-[var(--text-primary)] mb-3">Быстрые действия</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/incoming/register" className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-center">
                    <Plus className="w-5 h-5 text-[var(--accent)] mx-auto mb-1" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Регистрация</span>
                  </Link>
                  <Link href="/incoming" className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-center">
                    <Inbox className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Входящие</span>
                  </Link>
                  <Link href="/archive" className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-center">
                    <Archive className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Архив</span>
                  </Link>
                  <Link href="/documents" className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-center">
                    <FileText className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Документы</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Для ADMIN */}
            {role === "ADMIN" && (
              <div className="card p-5">
                <h2 className="font-semibold text-[var(--text-primary)] mb-3">Панель администратора</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/admin/employees" className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-center">
                    <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Сотрудники</span>
                  </Link>
                  <Link href="/admin/workflows" className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-center">
                    <BarChart3 className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Маршруты</span>
                  </Link>
                  <Link href="/admin/audit" className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-center">
                    <Shield className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Аудит</span>
                  </Link>
                  <Link href="/documents" className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-center">
                    <FileText className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Документы</span>
                  </Link>
                </div>
                <Link href="/admin/workflows" className="text-sm text-[var(--accent)] hover:underline mt-3 inline-block">
                  Управление шаблонами маршрутов →
                </Link>
              </div>
            )}

            {/* Уведомления */}
            {stats.unreadNotifications > 0 && (
              <div className="card p-4 flex items-center gap-4 bg-[var(--accent)]/5 border border-[var(--accent)]/20">
                <div className="w-10 h-10 bg-[var(--accent)]/20 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <p className="text-sm text-[var(--text-primary)]">
                  У вас <strong>{stats.unreadNotifications}</strong> непрочитанных уведомлений
                </p>
              </div>
            )}
          </div>

          {/* Правая колонка — активность и документы */}
          <div className="space-y-4">
            {/* Последние документы */}
            {recentDocs.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--accent)]" />
                  Последние документы
                </h2>
                <div className="space-y-2">
                  {recentDocs.map((doc) => (
                    <Link key={doc.id} href={`/documents/${doc.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{doc.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {typeLabels[doc.type] || doc.type}
                          {doc.author.employee ? ` · ${doc.author.employee.lastName} ${doc.author.employee.firstName}` : ""}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ml-2 ${
                        statusColors[doc.status] || ""
                      }`}>
                        {statusLabels[doc.status] || doc.status}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Лента активности */}
            {activity.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-[var(--accent)]" />
                  Последние действия
                </h2>
                <div className="space-y-1.5">
                  {activity.slice(0, 7).map((log) => {
                    const actionLabels: Record<string, string> = {
                      CREATE: "Создал(а)", EDIT: "Редактировал(а)",
                      APPROVE: "Согласовал(а)", REJECT: "Отклонил(а)",
                      RETURN: "Вернул(а)", SIGN: "Подписал(а)",
                      REGISTER: "Зарегистрировал(а)", ARCHIVE: "Архивировал(а)",
                      LOGIN: "Вошёл(ла)",
                    };
                    const entityLabels: Record<string, string> = {
                      InternalDocument: "документ", IncomingDocument: "входящий",
                    };
                    return (
                      <div key={log.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg-secondary)]">
                        <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                          <History className="w-3.5 h-3.5 text-[var(--accent)]" />
                        </div>
                        <div>
                          <p className="text-sm text-[var(--text-primary)]">
                            {actionLabels[log.action] || log.action} {entityLabels[log.entityType] || log.entityType}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {new Date(log.createdAt).toLocaleDateString("ru-RU", {
                              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
