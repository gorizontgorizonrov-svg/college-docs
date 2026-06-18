import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDocumentById, getPendingApprovals, sendToWorkflow } from "@/actions/documents";
import { getFileAttachments } from "@/actions/files";
import { ApprovalTimeline } from "@/components/ApprovalTimeline";
import { SignatureStamp } from "@/components/SignatureStamp";
import { ApprovalActions } from "./ApprovalActions";
import FileDownload from "@/components/FileDownload";
import {
  IconChevronRight,
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconArchive,
  IconFileText,
  IconHistory,
  IconDownload,
  IconThumbUp,
  IconSignature,
  IconPencil,
  IconSend,
  IconUser,
  IconGitBranch,
  IconClipboardList,
  IconFolderOpen,
} from "@tabler/icons-react";

const statusLabels: Record<string, string> = {
  DRAFT: "Черновик", IN_APPROVAL: "На согласовании", APPROVED: "Утверждён",
  REJECTED: "Отклонён", ARCHIVED: "В архиве",
};

const typeLabels: Record<string, string> = {
  ORDER: "Приказ", DIRECTIVE: "Распоряжение", PROTOCOL: "Протокол",
  ACT: "Акт", MEMO: "Служебная записка", CONTRACT: "Договор", REPORT: "Отчёт",
};

const statusChip: Record<string, string> = {
  DRAFT: "stchip-neutral", IN_APPROVAL: "stchip", APPROVED: "stchip-success",
  REJECTED: "stchip-danger", ARCHIVED: "stchip-info",
};

const statusIcon: Record<string, React.ReactNode> = {
  IN_APPROVAL: <IconClock size={14} />,
  APPROVED: <IconCircleCheck size={14} />,
  REJECTED: <IconCircleX size={14} />,
  ARCHIVED: <IconArchive size={14} />,
};

function computeDaysLeft(deadline: Date | null): number | null {
  if (!deadline) return null;
  return Math.ceil((deadline.getTime() - Date.now()) / 86400000);
}

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const doc = await getDocumentById(id);
  if (!doc) return <div className="empty-state"><p>Документ не найден</p></div>;

  const pendingApprovals = await getPendingApprovals(session.user.id);
  const myPendingApproval = pendingApprovals.find((a) => a.documentId === id);
  const fileAttachments = await getFileAttachments(id);

  const totalStages = doc.workflow?.stages?.length || 0;
  const decidedApprovals = doc.approvals.filter((a) => a.decision !== null);
  const approvedApprovals = doc.approvals.filter((a) => a.decision === "APPROVE");
  const progressPct = totalStages > 0 ? Math.round((approvedApprovals.length / totalStages) * 100) : 0;

  const isAuthor = doc.authorId === session.user.id;
  const canEdit = isAuthor && doc.status === "DRAFT";
  const canSend = isAuthor && doc.status === "DRAFT";
  const daysLeft = computeDaysLeft(doc.deadline);

  return (
    <div className="anim-fade-in">
      {/* Breadcrumbs */}
      <div className="crumb">
        <IconChevronRight size={14} />
        <span>{typeLabels[doc.type] || doc.type}</span>
        <IconChevronRight size={14} />
        <span>{doc.number ? doc.number.split("-").slice(0, 2).join("-") : "—"}</span>
        <IconChevronRight size={14} />
        <span>{doc.number || "—"}</span>
      </div>

      {/* Header */}
      <div className="doc-top">
        <div>
          <div className="doc-eyebrow">
            {doc.number && <span className="doc-num">{doc.number}</span>}
            <span className={statusChip[doc.status] || "stchip-neutral"}>
              {statusIcon[doc.status] || <IconFileText size={14} />}
              {statusLabels[doc.status] || doc.status}
            </span>
          </div>
          <div className="doc-h1">{doc.title}</div>
          <div className="doc-sub">
            Тип: {typeLabels[doc.type] || doc.type} · Создан {new Date(doc.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="act-row">
          <Link href={`/documents/versions/${id}`} className="btn btn-ghost">
            <IconHistory size={16} />История
          </Link>
          {doc.fileUrl && (
            <a href={doc.fileUrl} download className="btn btn-ghost">
              <IconDownload size={16} />PDF
            </a>
          )}
          {myPendingApproval && (
            <>
              <form action={async () => {
                "use server";
                const { submitApproval } = await import("@/actions/workflow");
                await submitApproval(myPendingApproval.id, "APPROVE");
              }}>
                <button type="submit" className="btn btn-green">
                  <IconThumbUp size={16} />Согласовать
                </button>
              </form>
              {(session.user.role === "SIGNER" || session.user.role === "ADMIN") && (
                <form action={async () => {
                  "use server";
                  const { submitSignature } = await import("@/actions/workflow");
                  await submitSignature(myPendingApproval.id);
                }}>
                  <button type="submit" className="btn btn-navy">
                    <IconSignature size={16} />Подписать ЭП
                  </button>
                </form>
              )}
            </>
          )}
          {canEdit && (
            <Link href={`/documents/${id}/edit`} className="btn">
              <IconPencil size={16} />Редактировать
            </Link>
          )}
          {canSend && (
            <form action={async () => {
              "use server";
              await sendToWorkflow(id);
            }}>
              <button type="submit" className="btn btn-navy">
                <IconSend size={16} />Отправить
              </button>
            </form>
          )}
          {doc.status === "APPROVED" && doc.signatures.length > 0 && (
            <SignatureStamp signature={doc.signatures[doc.signatures.length - 1]} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="st">
          <div className="st-lbl">Прогресс</div>
          <div className="st-val">{progressPct}%</div>
          <div className="st-sub">{approvedApprovals.length} из {totalStages} этапов</div>
        </div>
        <div className="st">
          <div className="st-lbl">Срок исполнения</div>
          <div className="st-val">{daysLeft !== null ? `${daysLeft} дн.` : "—"}</div>
          <div className="st-sub ok">{doc.deadline ? "В срок" : "Не указан"}</div>
        </div>
        <div className="st">
          <div className="st-lbl">Согласующих</div>
          <div className="st-val">{decidedApprovals.length} / {doc.approvals.length}</div>
          <div className="st-sub">участников</div>
        </div>
        <div className="st">
          <div className="st-lbl">Создан</div>
          <div className="st-val">{new Date(doc.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}</div>
          <div className="st-sub">
            {doc.author?.employee ? `${doc.author.employee.lastName} ${doc.author.employee.firstName?.charAt(0)}.` : doc.author?.email?.split("@")[0] || "—"}
          </div>
        </div>
      </div>

      {/* Requisites Card */}
      <div className="card">
        <div className="ch">
          <div className="ch-left"><IconUser size={16} />Реквизиты</div>
        </div>
        <div className="cb">
          <div className="mg">
            <div className="mf">
              <label>Автор</label>
              <span>
                {doc.author?.employee
                  ? `${doc.author.employee.lastName} ${doc.author.employee.firstName}`
                  : doc.author?.email || "—"}
              </span>
            </div>
            <div className="mf">
              <label>Должность</label>
              <span>{doc.author?.employee?.position?.name || "—"}</span>
            </div>
            <div className="mf">
              <label>Дата создания</label>
              <span>{new Date(doc.createdAt).toLocaleDateString("ru-RU")}</span>
            </div>
            <div className="mf">
              <label>Тип документа</label>
              <span>{typeLabels[doc.type] || doc.type}</span>
            </div>
          </div>

          {doc.content && (
            <>
              <div className="content-divider" />
              <div>
                <div className="form-label">Содержание</div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {doc.content}
                </div>
              </div>
            </>
          )}

          {fileAttachments.length > 0 && (
            <>
              <div className="content-divider" />
              <div>
                <div className="form-label">Прикреплённые файлы</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {fileAttachments.map((file) => (
                    <FileDownload
                      key={file.id}
                      file={file}
                      showPreview={true}
                    />
                  ))}
                  {fileAttachments.length > 1 && (
                    <form action="/api/download-zip" method="POST" target="_blank">
                      <input type="hidden" name="documentId" value={id} />
                      <button type="submit" style={{ cursor: "pointer", width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, border: "1px dashed var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontFamily: "inherit" }}>
                        <IconDownload size={16} />Скачать все файлы ZIP
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Approval Timeline */}
      <div className="card">
        <div className="ch">
          <div className="ch-left"><IconGitBranch size={16} />Маршрут согласования</div>
          {totalStages > 0 && (
            <div className="pb-row" style={{ width: 150 }}>
              <div className="pb-track"><div className="pb-fill" style={{ width: `${progressPct}%` }} /></div>
              <div className="pb-txt">{approvedApprovals.length} / {totalStages}</div>
            </div>
          )}
        </div>
        <div className="cb">
          <ApprovalTimeline
            workflow={doc.workflow}
            approvals={doc.approvals}
            signatures={doc.signatures}
          />
        </div>
      </div>

      {/* Approval Actions */}
      {myPendingApproval && (
        <div className="card">
          <div className="ch">
            <div className="ch-left"><IconSignature size={16} />Ваше решение</div>
          </div>
          <div className="cb">
            <ApprovalActions
              approvalId={myPendingApproval.id}
              canSign={session.user.role === "SIGNER" || session.user.role === "ADMIN"}
            />
          </div>
        </div>
      )}

      {/* Versions */}
      {doc.versions.length > 0 && (
        <div className="card">
          <div className="ch">
            <div className="ch-left"><IconClipboardList size={16} />Версии документа</div>
          </div>
          <div className="cb">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {doc.versions.map((v) => (
                <Link
                  key={v.id}
                  href={`/documents/versions/${v.id}`}
                  className="sb-item"
                  style={{ borderRadius: 8, padding: "8px 10px" }}
                >
                  <IconFolderOpen size={16} />
                  <span style={{ flex: 1 }}>
                    <span className="pname">Версия {v.version}</span>
                    {v.changeNote && <span className="prole" style={{ marginLeft: 6 }}>— {v.changeNote}</span>}
                  </span>
                  <span className="prole">{new Date(v.createdAt).toLocaleDateString("ru-RU")}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
