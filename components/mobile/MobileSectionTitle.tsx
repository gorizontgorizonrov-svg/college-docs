export default function MobileSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      color: "#6e668a", fontSize: 10, fontWeight: 600,
      letterSpacing: "0.06em", textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}
