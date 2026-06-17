import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/actions/profile";
import { prisma } from "@/lib/prisma";
import {
  User, Mail, Calendar, FileText, Clock, CheckCircle, Send,
  Bell, Edit3, Activity, Briefcase, Building, ArrowRight,
} from "lucide-react";

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
  if (!profile) return <div className="empty-state"><p>Профиль не найден</p></div>;

  const recentActivity = await prisma.auditLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <div className="anim-fade-in space-y-4">
      {/* Шапка профиля */}
      <div className="profile-banner">
        <div className="pb-av">
          {profile.employee
            ? (profile.employee.firstName?.[0] || "") + (profile.employee.lastName?.[0] || "")
            : "?"}
        </div>
        <div className="pb-info">
          <div className="pb-name">
            {profile.employee
              ? `${profile.employee.lastName} ${profile.employee.firstName} ${profile.employee.middleName || ""}`
              : "Пользователь"}
            <span className={`badge ${roleColors[profile.user.role] || "badge-neutral"}`} style={{ marginLeft: 10, verticalAlign: "middle" }}>
              {roleLabels[profile.user.role] || profile.user.role}
            </span>
          </div>
          <div className="pb-role">
            {profile.employee?.position && <><Briefcase size={12} style={{ verticalAlign: -1 }} /> {profile.employee.position} <span>·</span></>}
            {profile.employee?.department && <><Building size={12} style={{ verticalAlign: -1 }} /> {profile.employee.department} <span>·</span></>}
            <Mail size={12} style={{ verticalAlign: -1 }} /> {profile.user.email}
            <span>·</span>
            <Calendar size={12} style={{ verticalAlign: -1 }} /> С {new Date(profile.user.createdAt).toLocaleDateString("ru-RU")}
          </div>
        </div>
        <div className="pb-actions">
          <Link href="/settings" className="btn">
            <Edit3 size={16} />
            Редактировать
          </Link>
        </div>
      </div>

      {/* Статистика */}
      <div className="stat-tabs">
        <div className="stab">
          <div className="stab-header">
            <div className="stab-icon ic-blue"><FileText size={14} /></div>
            <span className="stab-lbl">Всего документов</span>
          </div>
          <div className="stab-val">{profile.stats.totalDocuments}</div>
        </div>
        <div className="stab">
          <div className="stab-header">
            <div className="stab-icon ic-purple"><Send size={14} /></div>
            <span className="stab-lbl">На согласовании</span>
          </div>
          <div className="stab-val">{profile.stats.inApproval}</div>
        </div>
        <div className="stab">
          <div className="stab-header">
            <div className="stab-icon ic-green"><CheckCircle size={14} /></div>
            <span className="stab-lbl">Утверждено</span>
          </div>
          <div className="stab-val">{profile.stats.approved}</div>
        </div>
        <div className="stab">
          <div className="stab-header">
            <div className="stab-icon ic-amber"><Bell size={14} /></div>
            <span className="stab-lbl">Уведомлений</span>
          </div>
          <div className="stab-val">{profile.stats.unreadNotifications}</div>
        </div>
      </div>

      <div className="grid2">
        {/* Личные данные */}
        <div className="card">
          <div className="ch">
            <div className="ch-l"><User size={14} />Личные данные</div>
          </div>
          <div className="cb">
            <div className="mg">
              <div className="mf">
                <label>Фамилия</label>
                <span>{profile.employee?.lastName || "—"}</span>
              </div>
              <div className="mf">
                <label>Имя</label>
                <span>{profile.employee?.firstName || "—"}</span>
              </div>
              <div className="mf">
                <label>Отчество</label>
                <span>{profile.employee?.middleName || "—"}</span>
              </div>
              <div className="mf">
                <label>Должность</label>
                <span>{profile.employee?.position || "—"}</span>
              </div>
              <div className="mf">
                <label>Отдел</label>
                <span>{profile.employee?.department || "—"}</span>
              </div>
              <div className="mf">
                <label>Email</label>
                <span>{profile.user.email}</span>
              </div>
              <div className="mf">
                <label>Роль</label>
                <span>{roleLabels[profile.user.role] || profile.user.role}</span>
              </div>
              <div className="mf">
                <label>Статус</label>
                <span className={`badge ${profile.user.isActive ? "badge-success" : "badge-danger"}`}>
                  {profile.user.isActive ? "Активен" : "Заблокирован"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Последние действия */}
        <div className="card">
          <div className="ch">
            <div className="ch-l"><Activity size={14} />Последние действия</div>
          </div>
          <div className="cb">
            {recentActivity.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px 10px" }}>
                <p>Нет действий</p>
              </div>
            ) : (
              recentActivity.map((log) => {
                const actionLabels: Record<string, string> = {
                  CREATE: "создал(а)", EDIT: "редактировал(а)", DELETE: "удалил(а)",
                  APPROVE: "согласовал(а)", REJECT: "отклонил(а)", RETURN: "вернул(а)",
                  SIGN: "подписал(а)", REGISTER: "зарегистрировал(а)",
                  ARCHIVE: "архивировал(а)", LOGIN: "вошёл(ла)", DOWNLOAD: "скачал(а)",
                };
                const entityLabels: Record<string, string> = {
                  InternalDocument: "документ", IncomingDocument: "входящий",
                  DocumentApproval: "согласование", DigitalSignature: "подпись",
                };
                return (
                  <div key={log.id} className="act-item">
                    <div className="act-av">
                      {profile.employee?.firstName?.[0] || "?"}
                    </div>
                    <div className="act-text">
                      <b>{profile.employee?.firstName || "Пользователь"}</b>{" "}
                      {actionLabels[log.action] || log.action}{" "}
                      {entityLabels[log.entityType] || log.entityType}
                    </div>
                    <div className="act-time">
                      {new Date(log.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
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
        <div className="card" style={{ padding: "10px 14px" }}>
          <div className="act-item" style={{ border: "none", padding: 0 }}>
            <div className="act-av ic-purple"><Clock size={12} /></div>
            <div className="act-text">
              {profile.stats.pendingApprovals > 0
                ? <><b>{profile.stats.pendingApprovals}</b> документ(ов) на согласовании</>
                : "Нет ожидающих документов"}
            </div>
            {profile.stats.pendingApprovals > 0 && (
              <Link href="/documents/pending" className="btn btn-navy" style={{ fontSize: 10.5, padding: "4px 10px" }}>
                Перейти <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Быстрые ссылки */}
      <div className="admin-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Link href="/documents" className="ag-item">
          <div className="ag-icon ic-blue"><FileText size={16} /></div>
          <div className="ag-lbl">Мои документы</div>
        </Link>
        <Link href="/documents/create" className="ag-item">
          <div className="ag-icon ic-green"><Edit3 size={16} /></div>
          <div className="ag-lbl">Создать документ</div>
        </Link>
        <Link href="/archive" className="ag-item">
          <div className="ag-icon ic-purple"><FileText size={16} /></div>
          <div className="ag-lbl">Архив</div>
        </Link>
        <Link href="/dashboard" className="ag-item">
          <div className="ag-icon ic-amber"><Activity size={16} /></div>
          <div className="ag-lbl">Дашборд</div>
        </Link>
      </div>
    </div>
  );
}
