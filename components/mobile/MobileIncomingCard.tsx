import Link from "next/link";
import { IconAlertCircle, IconEye, IconDownload } from "@tabler/icons-react";

const statusStyles: Record<string, { bg: string; color: string; text: string }> = {
  REGISTERED: { bg: "rgba(91,156,246,0.15)", color: "#5b9cf6", text: "Зарегистрирован" },
  UNDER_RESOLUTION: { bg: "rgba(212,160,23,0.15)", color: "#d4a017", text: "На резолюции" },
  IN_EXECUTION: { bg: "rgba(212,160,23,0.15)", color: "#d4a017", text: "На исполнении" },
  EXECUTED: { bg: "rgba(52,199,138,0.15)", color: "#34c78a", text: "Исполнен" },
  ARCHIVED: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8", text: "В архиве" },
};

function getDeadlineInfo(deadline: Date | null): { color: string; isOverdue: boolean; label: string } {
  if (!deadline) return { color: "var(--text-muted)", isOverdue: false, label: "—" };
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / 86400000);
  const label = deadline.toLocaleDateString("ru-RU");
  if (daysLeft < 0) return { color: "var(--danger)", isOverdue: true, label: `Просрочено ${label}` };
  if (daysLeft <= 3) return { color: "var(--warning)", isOverdue: false, label: `${label} (ост. ${daysLeft}д)` };
  return { color: "var(--text-muted)", isOverdue: false, label };
}

export default function MobileIncomingCard({
  doc,
}: {
  doc: {
    id: string; incomingNumber: string; title: string; fromOrg: string;
    status: string; deadline: Date | null; fileUrl?: string | null;
    incomingDate: Date;
  };
}) {
  const badge = statusStyles[doc.status] || statusStyles.REGISTERED;
  const dl = getDeadlineInfo(doc.deadline);

  return (
    <Link
      href={`/incoming/${doc.id}`}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `0.5px solid ${dl.isOverdue ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 10,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        cursor: "pointer",
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, minWidth: 60 }}>
          {doc.incomingNumber}
        </span>
        <span style={{
          background: badge.bg, color: badge.color, fontSize: 10,
          padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", fontWeight: 500,
        }}>
          {badge.text}
        </span>
        {dl.isOverdue && <IconAlertCircle size={14} style={{ color: "var(--danger)", flexShrink: 0 }} />}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", lineHeight: "1.3" }}>
        {doc.title}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "var(--text-muted)" }}>
        <span>{doc.fromOrg}</span>
        <span>·</span>
        <span>{new Date(doc.incomingDate).toLocaleDateString("ru-RU")}</span>
        <span>·</span>
        <span style={{ color: dl.color }}>{dl.label}</span>
        {doc.fileUrl && (
          <span style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              style={{ color: "var(--text-muted)", display: "flex" }}>
              <IconEye size={14} />
            </a>
            <a href={doc.fileUrl} download onClick={(e) => e.stopPropagation()}
              style={{ color: "var(--text-muted)", display: "flex" }}>
              <IconDownload size={14} />
            </a>
          </span>
        )}
      </div>
    </Link>
  );
}
