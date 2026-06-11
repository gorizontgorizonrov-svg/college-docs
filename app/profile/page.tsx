import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/actions/profile";
import { prisma } from "@/lib/prisma";
import { User, Mail, Calendar, FileText, Clock, CheckCircle, Send, Bell, Edit3, Activity, Briefcase, Building } from "lucide-react";

const roleLabels: Record<string, string> = {
  INITIATOR: "Инициатор", VALIDATOR: "Согласующий",
  SIGNER: "Подписант", REGISTRAR: "Регистратор", ADMIN: "Администратор",
};

const roleColors: Record<string, string> = {
  INITIATOR: "badge-neutral", VALIDATOR: "badge-warning",
  SIGNER: "badge-success", REGISTRAR: "badge-info", ADMIN: "badge-danger",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getProfile(session.user.id);
  if (!profile) return <div className="p-8 text-center text-[var(--text-muted)]">Профиль не найден</div>;

  const recentActivity = await prisma.auditLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <div className="min-h-screen ">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Шапка профиля */}
        <div className="card p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
              <User className="w-10 h-10 text-[var(--accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                  {profile.employee
                    ? `${profile.employee.lastName} ${profile.employee.firstName} ${profile.employee.middleName || ""}`
                    : "Пользователь"}
                </h1>
                <span className={`px-3 py-1 text-xs rounded-full ${roleColors[profile.user.role] || "badge-neutral"}`}>
                  {roleLabels[profile.user.role] || profile.user.role}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-[var(--text-muted)]">
                {profile.employee?.position && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    {profile.employee.position}
                  </span>
                )}
                {profile.employee?.department && (
                  <span className="flex items-center gap-1.5">
                    <Building className="w-4 h-4" />
                    {profile.employee.department}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {profile.user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  На сайте с {new Date(profile.user.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <FileText className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[var(--text-primary)]">{profile.stats.totalDocuments}</p>
            <p className="text-xs text-[var(--text-muted)]">Всего документов</p>
          </div>
          <div className="card p-4 text-center">
            <Send className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[var(--text-primary)]">{profile.stats.inApproval}</p>
            <p className="text-xs text-[var(--text-muted)]">На согласовании</p>
          </div>
          <div className="card p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[var(--text-primary)]">{profile.stats.approved}</p>
            <p className="text-xs text-[var(--text-muted)]">Утверждено</p>
          </div>
          <div className="card p-4 text-center">
            <Bell className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[var(--text-primary)]">{profile.stats.unreadNotifications}</p>
            <p className="text-xs text-[var(--text-muted)]">Уведомлений</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Информация о сотруднике */}
          <div className="card p-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--accent)]" />
              Личные данные
            </h2>
            <div className="space-y-3 text-sm">
              {[
                { label: "Фамилия", value: profile.employee?.lastName || "—" },
                { label: "Имя", value: profile.employee?.firstName || "—" },
                { label: "Отчество", value: profile.employee?.middleName || "—" },
                { label: "Должность", value: profile.employee?.position || "—" },
                { label: "Отдел", value: profile.employee?.department || "—" },
                { label: "Email", value: profile.user.email },
                { label: "Роль в системе", value: roleLabels[profile.user.role] || profile.user.role },
                { label: "Статус", value: profile.user.isActive ? "Активен" : "Заблокирован" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0">
                  <span className="text-[var(--text-muted)]">{item.label}</span>
                  <span className="font-medium text-[var(--text-primary)] text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Последние действия */}
          <div className="card p-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--accent)]" />
              Последние действия
            </h2>
            <div className="space-y-2">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">Нет действий</p>
              ) : (
                recentActivity.map((log) => {
                  const actionLabels: Record<string, string> = {
                    CREATE: "Создал(а)", EDIT: "Редактировал(а)", DELETE: "Удалил(а)",
                    APPROVE: "Согласовал(а)", REJECT: "Отклонил(а)", RETURN: "Вернул(а)",
                    SIGN: "Подписал(а)", REGISTER: "Зарегистрировал(а)",
                    ARCHIVE: "Архивировал(а)", LOGIN: "Вошёл(ла)", DOWNLOAD: "Скачал(а)",
                  };
                  const entityLabels: Record<string, string> = {
                    InternalDocument: "документ", IncomingDocument: "входящий",
                    DocumentApproval: "согласование", DigitalSignature: "подпись",
                  };
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-[var(--bg-secondary)]">
                      <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="w-3.5 h-3.5 text-[var(--accent)]" />
                      </div>
                      <div className="min-w-0">
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
                })
              )}
            </div>
          </div>
        </div>

        {/* Ожидают решения */}
        {(profile.user.role === "VALIDATOR" || profile.user.role === "SIGNER" || profile.user.role === "ADMIN") && (
          <div className="card p-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--accent)]" />
              Ожидают решения
            </h2>
            {profile.stats.pendingApprovals > 0 ? (
              <Link href="/documents/pending" className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline">
                {profile.stats.pendingApprovals} документ(ов) на согласовании →
              </Link>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Нет ожидающих документов</p>
            )}
          </div>
        )}

        {/* Быстрые ссылки */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/documents" className="card p-4 text-center hover:border-[var(--accent)]/30 transition-colors">
            <FileText className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Мои документы</p>
          </Link>
          <Link href="/documents/create" className="card p-4 text-center hover:border-[var(--accent)]/30 transition-colors">
            <Edit3 className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Создать документ</p>
          </Link>
          <Link href="/archive" className="card p-4 text-center hover:border-[var(--accent)]/30 transition-colors">
            <FileText className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Архив</p>
          </Link>
          <Link href="/dashboard" className="card p-4 text-center hover:border-[var(--accent)]/30 transition-colors">
            <Activity className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Дашборд</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
