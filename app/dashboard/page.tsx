import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDashboardStats, getActivityFeed } from "@/actions/dashboard";
import { prisma } from "@/lib/prisma";
import {
  FileText, Send, CheckCircle, Clock, AlertCircle, Plus, ArrowRight,
  Timer, User, Inbox, Archive, Users, Shield,
  LayoutGrid, Activity, GitBranch, Bell,
  FileSignature, BookOpen, FileEdit, Settings,
} from "lucide-react";
import { getDict } from "@/lib/i18n/getDict";
import { getLocale } from "@/lib/i18n/server";

const statusLabels: Record<string, string> = {
  DRAFT: "Черновик", IN_APPROVAL: "На согласовании", APPROVED: "Утверждён",
  REJECTED: "Отклонён", ARCHIVED: "В архиве",
};

const typeLabels: Record<string, string> = {
  ORDER: "Приказ", DIRECTIVE: "Распоряжение", PROTOCOL: "Протокол",
  ACT: "Акт", MEMO: "Служебная записка", CONTRACT: "Договор", REPORT: "Отчёт",
};

const statusBadgeClass: Record<string, string> = {
  DRAFT: "db-gray",
  IN_APPROVAL: "db-blue",
  APPROVED: "db-green",
  REJECTED: "db-red",
  ARCHIVED: "db-amber",
};

function getInitials(firstName?: string, lastName?: string) {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  return "?";
}

async function getRoleDescription(role: string) {
  const descs: Record<string, string> = {
    INITIATOR: "Создавайте и отправляйте документы",
    VALIDATOR: "Проверяйте и согласовывайте документы",
    SIGNER: "Подписывайте и утверждайте документы",
    REGISTRAR: "Регистрируйте входящие и управляйте архивом",
    ADMIN: "Управляйте системой и сотрудниками",
  };
  return descs[role] || "";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const locale = await getLocale();
  const dict = await getDict(locale);
  const roleName = dict.role[session.user.role as keyof typeof dict.role] || session.user.role;

  const [stats, activity, employee] = await Promise.all([
    getDashboardStats(session.user.id),
    getActivityFeed(session.user.id),
    prisma.employee.findUnique({
      where: { userId: session.user.id },
      include: { position: true, department: true },
    }),
  ]);

  const role = session.user.role;
  const displayName = employee
    ? `${employee.firstName} ${employee.lastName}`
    : session.user.email?.split("@")[0] || "Пользователь";
  const initials = getInitials(employee?.firstName, employee?.lastName);

  const overdueApprovals = (role === "VALIDATOR" || role === "SIGNER" || role === "ADMIN")
    ? await prisma.documentApproval.findMany({
        where: { approverId: session.user.id, decision: null, document: { status: "IN_APPROVAL" } },
        include: { document: true, stage: true },
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
  });

  const roleDescription = await getRoleDescription(role);
  const canCreate = role === "INITIATOR" || role === "VALIDATOR" || role === "ADMIN";
  const isAdmin = role === "ADMIN";
  const isValidator = role === "VALIDATOR" || role === "SIGNER";
  const isRegistrar = role === "REGISTRAR";

  const actionLabels: Record<string, string> = {
    CREATE: "создал(а)", EDIT: "редактировал(а)",
    APPROVE: "согласовал(а)", REJECT: "отклонил(а)",
    RETURN: "вернул(а)", SIGN: "подписал(а)",
    REGISTER: "зарегистрировал(а)", ARCHIVE: "архивировал(а)",
    LOGIN: "вошёл(ла)", DOWNLOAD: "скачал(а)",
  };
  const entityLabels: Record<string, string> = {
    InternalDocument: "документ", IncomingDocument: "входящий",
  };

  const typeIconMap: Record<string, string> = {
    ORDER: "ic-blue", DIRECTIVE: "ic-green", PROTOCOL: "ic-purple",
    ACT: "ic-amber", MEMO: "ic-amber", CONTRACT: "ic-blue", REPORT: "ic-green",
  };

  return (
    <div className="anim-fade-in">
      {/* PROFILE BANNER */}
      <div className="profile-banner anim-slide-up">
        <div className="pb-av">{initials}</div>
        <div className="pb-info">
          <div className="pb-name">{displayName}</div>
          <div className="pb-role">
            {roleName}
            {employee?.department?.name && <><span>·</span>{employee.department.name}</>}
            <span>·</span>
            {roleDescription}
          </div>
        </div>
        <div className="pb-actions">
          {canCreate && (
            <Link href="/documents/create" className="btn btn-navy">
              <Plus size={16} />
              Создать
            </Link>
          )}
          <Link href="/profile" className="btn">
            <User size={16} />
            Профиль
          </Link>
        </div>
      </div>

      {/* STAT TABS */}
      <div className="stat-tabs anim-stagger">
        <Link href="/documents" className="stab">
          <div className="stab-header">
            <div className="stab-icon ic-blue"><FileText size={14} /></div>
            <span className="stab-lbl">Документы</span>
          </div>
          <div className="stab-val">{stats.totalDocuments}</div>
          <div className="stab-sub">Всего в системе</div>
        </Link>
        <Link href="/documents?status=DRAFT" className="stab">
          <div className="stab-header">
            <div className="stab-icon ic-amber"><Inbox size={14} /></div>
            <span className="stab-lbl">Черновики</span>
          </div>
          <div className="stab-val">{stats.draftDocuments}</div>
          <div className="stab-sub">Требуют внимания</div>
        </Link>
        <Link href="/documents/pending" className="stab">
          <div className="stab-header">
            <div className="stab-icon ic-purple"><Send size={14} /></div>
            <span className="stab-lbl">На согласовании</span>
          </div>
          <div className="stab-val">{stats.inApproval}</div>
          <div className="stab-sub">Ожидают решения</div>
        </Link>
        <Link href="/documents?status=APPROVED" className="stab">
          <div className="stab-header">
            <div className="stab-icon ic-green"><CheckCircle size={14} /></div>
            <span className="stab-lbl">Утверждено</span>
          </div>
          <div className="stab-val">{stats.approved}</div>
          <div className="stab-sub">Завершённых</div>
        </Link>
      </div>

      {/* NOTIFICATION BANNER */}
      {stats.unreadNotifications > 0 && (
        <div className="card" style={{ padding: "10px 14px", marginBottom: 12, background: "var(--accent-light)", color: "#fff", border: "none" }}>
          <div className="act-item" style={{ border: "none", padding: 0 }}>
            <div className="act-av" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
              <Bell size={12} />
            </div>
            <div className="act-text" style={{ color: "#fff" }}>
              У вас <b style={{ color: "#fff" }}>{stats.unreadNotifications}</b> непрочитанных уведомлений
            </div>
            <Link href="/dashboard" className="btn" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", fontSize: 10.5 }}>
              <Bell size={12} />
              Открыть
            </Link>
          </div>
        </div>
      )}

      {/* GRID2 */}
      <div className="grid2 anim-stagger">
        {/* LEFT COLUMN — Role-based content */}
        <div className="card">
          <div className="ch">
            <div className="ch-l">
              {isAdmin ? <LayoutGrid size={14} /> : isValidator ? <Clock size={14} /> : isRegistrar ? <Inbox size={14} /> : <FileText size={14} />}
              {isAdmin ? "Панель администратора" : isValidator ? "Ожидают решения" : isRegistrar ? "Быстрые действия" : "Мои документы"}
            </div>
            {(isAdmin || isValidator) && (
              <Link href={isAdmin ? "/admin/workflows" : "/documents/pending"} className="ch-r">
                {isAdmin ? "Управление шаблонами →" : "Все →"}
              </Link>
            )}
          </div>
          <div className="cb">
            {/* ADMIN: admin grid */}
            {isAdmin && (
              <>
                <div className="admin-grid">
                  <Link href="/admin/employees" className="ag-item">
                    <div className="ag-icon ic-blue"><Users size={16} /></div>
                    <div className="ag-lbl">Сотрудники</div>
                  </Link>
                  <Link href="/admin/workflows" className="ag-item">
                    <div className="ag-icon ic-purple"><GitBranch size={16} /></div>
                    <div className="ag-lbl">Маршруты</div>
                  </Link>
                  <Link href="/admin/audit" className="ag-item">
                    <div className="ag-icon ic-amber"><Shield size={16} /></div>
                    <div className="ag-lbl">Аудит</div>
                  </Link>
                  <Link href="/documents" className="ag-item">
                    <div className="ag-icon ic-green"><FileText size={16} /></div>
                    <div className="ag-lbl">Документы</div>
                  </Link>
                </div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--bg-hover)" }}>
                  <Link href="/admin/workflows" className="ag-link">
                    <Settings size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
                    Управление шаблонами маршрутов →
                  </Link>
                </div>
              </>
            )}

            {/* VALIDATOR/SIGNER: pending approvals */}
            {isValidator && (
              <>
                {stats.pendingApprovals > 0 && (
                  <Link href="/documents/pending" className="doc-item" style={{ padding: "10px 0" }}>
                    <div className="doc-ico ic-purple"><AlertCircle size={14} /></div>
                    <div className="doc-info">
                      <div className="doc-type">Ожидают решения</div>
                      <div className="doc-name">{stats.pendingApprovals} документов на согласовании</div>
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 4 }} />
                  </Link>
                )}
                {overdueApprovals.some(a => {
                  const deadline = a.stage?.deadlineDays ? new Date(a.document.createdAt) : null;
                  if (!deadline) return false;
                  deadline.setDate(deadline.getDate() + a.stage!.deadlineDays!);
                  return deadline < new Date();
                }) && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--danger)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <Timer size={12} /> Просроченные документы
                    </div>
                    {overdueApprovals.filter(a => {
                      const deadline = a.stage?.deadlineDays ? new Date(a.document.createdAt) : null;
                      if (!deadline) return false;
                      deadline.setDate(deadline.getDate() + a.stage!.deadlineDays!);
                      return deadline < new Date();
                    }).slice(0, 3).map(a => (
                      <Link key={a.id} href={`/documents/${a.document.id}`} className="doc-item">
                        <div className="doc-ico ic-amber"><Clock size={14} /></div>
                        <div className="doc-info">
                          <div className="doc-name">{a.document.title}</div>
                          <div className="doc-author">Просрочено</div>
                        </div>
                        <div className="doc-badge db-red">Просрочено</div>
                      </Link>
                    ))}
                  </div>
                )}
                {stats.pendingApprovals === 0 && (
                  <div className="empty-state" style={{ padding: "20px 10px" }}>
                    <CheckCircle size={24} style={{ color: "var(--success)", marginBottom: 6, display: "block", margin: "0 auto 6px" }} />
                    <p>Нет документов на согласовании</p>
                  </div>
                )}
              </>
            )}

            {/* INITIATOR: my docs */}
            {role === "INITIATOR" && (
              <>
                {myInProgress.length > 0 ? myInProgress.map(doc => (
                  <Link key={doc.id} href={`/documents/${doc.id}`} className="doc-item">
                    <div className={`doc-ico ${typeIconMap[doc.type] || "ic-blue"}`}>
                      {doc.type === "REPORT" ? <BookOpen size={14} /> :
                       doc.type === "MEMO" ? <FileEdit size={14} /> :
                       doc.type === "CONTRACT" ? <FileSignature size={14} /> :
                       <FileText size={14} />}
                    </div>
                    <div className="doc-info">
                      <div className="doc-type">{typeLabels[doc.type] || doc.type}</div>
                      <div className="doc-name">{doc.title}</div>
                    </div>
                    <div className={`doc-badge ${statusBadgeClass[doc.status] || "db-gray"}`}>
                      {statusLabels[doc.status] || doc.status}
                    </div>
                  </Link>
                )) : (
                  <div className="empty-state" style={{ padding: "20px 10px" }}>
                    <FileText size={24} style={{ color: "var(--text-muted)", marginBottom: 6, display: "block", margin: "0 auto 6px" }} />
                    <p>У вас пока нет документов</p>
                  </div>
                )}
                <Link href="/documents" className="ag-link" style={{ marginTop: 8, display: "inline-block" }}>
                  Все документы →
                </Link>
              </>
            )}

            {/* REGISTRAR: quick actions */}
            {isRegistrar && (
              <div className="admin-grid">
                <Link href="/incoming/register" className="ag-item">
                  <div className="ag-icon ic-blue"><Plus size={16} /></div>
                  <div className="ag-lbl">Регистрация</div>
                </Link>
                <Link href="/incoming" className="ag-item">
                  <div className="ag-icon ic-purple"><Inbox size={16} /></div>
                  <div className="ag-lbl">Входящие</div>
                </Link>
                <Link href="/archive" className="ag-item">
                  <div className="ag-icon ic-amber"><Archive size={16} /></div>
                  <div className="ag-lbl">Архив</div>
                </Link>
                <Link href="/documents" className="ag-item">
                  <div className="ag-icon ic-green"><FileText size={16} /></div>
                  <div className="ag-lbl">Документы</div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Recent documents */}
        <div className="card anim-slide-up">
          <div className="ch">
            <div className="ch-l"><Clock size={14} />Последние документы</div>
            <Link href="/documents" className="ch-r">Все документы →</Link>
          </div>
          <div className="cb">
            {recentDocs.length > 0 ? recentDocs.map(doc => (
              <Link key={doc.id} href={`/documents/${doc.id}`} className="doc-item">
                <div className={`doc-ico ${typeIconMap[doc.type] || "ic-blue"}`}>
                  {doc.type === "REPORT" ? <BookOpen size={14} /> :
                   doc.type === "MEMO" ? <FileEdit size={14} /> :
                   doc.type === "CONTRACT" ? <FileSignature size={14} /> :
                   <FileText size={14} />}
                </div>
                <div className="doc-info">
                  <div className="doc-type">
                    {typeLabels[doc.type] || doc.type}
                    {doc.authorId === session.user.id ? "" : ""}
                  </div>
                  <div className="doc-name">{doc.title}</div>
                </div>
                <div className={`doc-badge ${statusBadgeClass[doc.status] || "db-gray"}`}>
                  {statusLabels[doc.status] || doc.status}
                </div>
              </Link>
            )) : (
              <div className="empty-state" style={{ padding: "20px 10px" }}>
                <FileText size={24} style={{ color: "var(--text-muted)", marginBottom: 6, display: "block", margin: "0 auto 6px" }} />
                <p>Нет документов</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVITY */}
      {activity.length > 0 && (
        <div className="card anim-stagger">
          <div className="ch">
            <div className="ch-l"><Activity size={14} />Последние действия</div>
            <Link href="/admin/audit" className="ch-r">Весь журнал →</Link>
          </div>
          <div className="cb">
            {activity.slice(0, 7).map(log => (
              <div key={log.id} className="act-item">
                <div className="act-av">
                  {log.userId === session.user.id ? initials[0] : "?"}
                </div>
                <div className="act-text">
                  <b>{displayName}</b> {actionLabels[log.action] || log.action}{" "}
                  {entityLabels[log.entityType] || log.entityType}
                </div>
                <div className="act-time">
                  {new Date(log.createdAt).toLocaleDateString("ru-RU", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
