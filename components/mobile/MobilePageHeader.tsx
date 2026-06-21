export default function MobilePageHeader({
  title, action,
}: {
  title: string; action?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <h1 style={{
        fontSize: 17, fontWeight: 700, color: "var(--text-primary)", lineHeight: "1.2", margin: 0,
      }}>
        {title}
      </h1>
      {action}
    </div>
  );
}
