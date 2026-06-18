export default function WorkflowsLoading() {
  return (
    <div className="anim-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div style={{ width: 220, height: 24, background: "var(--bg-hover)", borderRadius: 6 }} />
        <div style={{ width: 140, height: 34, background: "var(--bg-hover)", borderRadius: 8 }} />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="card" style={{ opacity: 0.6, padding: 16 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg-hover)" }} />
              <div>
                <div style={{ width: 160, height: 13, background: "var(--bg-hover)", borderRadius: 4, marginBottom: 4 }} />
                <div style={{ width: 100, height: 10, background: "var(--bg-hover)", borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3].map(j => <div key={j} style={{ width: 80, height: 22, background: "var(--bg-hover)", borderRadius: 8 }} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
