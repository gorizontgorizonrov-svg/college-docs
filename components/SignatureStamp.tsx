interface SignatureStampProps {
  signature: {
    id: string;
    employee: { firstName: string; lastName: string; position?: { name: string } } | null;
    createdAt: string | Date;
    signatureData: string;
  };
}

export function SignatureStamp({ signature }: SignatureStampProps) {
  const sigShort = signature.signatureData.split(":")[0]?.slice(0, 4) || "??";
  const positionName = (signature as any).employee?.position?.name || "Сотрудник";

  return (
    <div className="border-2 border-[var(--accent)]/30 rounded-xl p-4 min-w-[200px] bg-[var(--bg-card)] shadow-lg">
      <p className="text-sm font-bold text-[var(--accent)] mb-2">УТВЕРЖДАЮ</p>
      <p className="font-medium text-[var(--text-primary)]">
        {signature.employee?.lastName} {signature.employee?.firstName}
      </p>
      <p className="text-sm text-[var(--text-muted)]">{positionName}</p>
      <p className="text-sm text-[var(--text-muted)]">{new Date(signature.createdAt).toLocaleDateString("ru-RU")}</p>
      <p className="text-xs text-[var(--accent)] mt-2 font-mono">ЭП: {sigShort}:...:12</p>
    </div>
  );
}
