import Link from "next/link";
import { IconFileText, IconBook, IconEdit, IconSignature } from "@tabler/icons-react";

const typeLabels: Record<string, string> = {
  ORDER: "Приказ", DIRECTIVE: "Распоряжение", PROTOCOL: "Протокол",
  ACT: "Акт", MEMO: "Служебная записка", CONTRACT: "Договор", REPORT: "Отчёт",
};

const statusStyles: Record<string, { bg: string; color: string; text: string }> = {
  DRAFT: { bg: "rgba(212,160,23,0.15)", color: "#d4a017", text: "Черновик" },
  IN_APPROVAL: { bg: "rgba(91,156,246,0.15)", color: "#5b9cf6", text: "На согласовании" },
  APPROVED: { bg: "rgba(52,199,138,0.15)", color: "#34c78a", text: "Утверждён" },
  REJECTED: { bg: "rgba(248,113,113,0.15)", color: "#f87171", text: "Отклонён" },
  ARCHIVED: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8", text: "В архиве" },
};

export default function MobileDocCard({
  doc,
  href,
}: {
  doc: { id: string; title: string; type: string; status: string; number?: string | null; createdAt?: Date };
  href?: string;
}) {
  const link = href || `/documents/${doc.id}`;
  const badge = statusStyles[doc.status] || statusStyles.DRAFT;
  const IconComp = doc.type === "REPORT" ? IconBook : doc.type === "MEMO" ? IconEdit : doc.type === "CONTRACT" ? IconSignature : IconFileText;

  return (
    <Link
      href={link}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        textDecoration: "none",
      }}
    >
      <span style={{
        fontSize: 18, color: "var(--accent)", minWidth: 18, display: "flex",
      }}>
        <IconComp size={18} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "var(--text-primary)", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
          {doc.title}
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: 10, margin: "2px 0 0" }}>
          {typeLabels[doc.type] || doc.type}
          {doc.number && <span> · {doc.number}</span>}
        </p>
      </div>
      <span style={{
        background: badge.bg, color: badge.color, fontSize: 10,
        padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", fontWeight: 500,
      }}>
        {badge.text}
      </span>
    </Link>
  );
}
