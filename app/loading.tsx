export default function RootLoading() {
  return (
    <div className="page-loader active">
      <div className="spinner" />
      <span style={{ marginLeft: 12, fontSize: 13, color: "var(--text-muted)" }}>Загрузка...</span>
    </div>
  );
}
