export default function MobileStatCard({
  label, value, sub, color, icon,
}: {
  label: string; value: number; sub: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "0.5px solid rgba(255,255,255,0.09)",
      borderRadius: 12,
      padding: "11px 13px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <span style={{ color, display: "flex" }}>{icon}</span>
        <span style={{ color: "#8f87b0", fontSize: 11, lineHeight: "1.3" }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
      <div style={{ color: "#5f5880", fontSize: 10, marginTop: 3 }}>{sub}</div>
    </div>
  );
}
