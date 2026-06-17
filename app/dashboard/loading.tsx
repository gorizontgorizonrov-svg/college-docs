export default function DashboardLoading() {
  return (
    <div className="anim-fade-in" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 0" }}>
      <div className="profile-banner" style={{ opacity: 0.6 }}>
        <div className="pb-av" style={{ background: "var(--bg-hover)", color: "transparent" }}>?</div>
        <div className="pb-info">
          <div style={{ width: 200, height: 18, background: "var(--bg-hover)", borderRadius: 4, marginBottom: 6 }} />
          <div style={{ width: 300, height: 12, background: "var(--bg-hover)", borderRadius: 4 }} />
        </div>
      </div>
      <div className="stat-tabs">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stab" style={{ opacity: 0.6 }}>
            <div className="stab-header">
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--bg-hover)" }} />
              <div style={{ width: 80, height: 11, background: "var(--bg-hover)", borderRadius: 4 }} />
            </div>
            <div style={{ width: 60, height: 26, background: "var(--bg-hover)", borderRadius: 4, marginBottom: 4 }} />
            <div style={{ width: 100, height: 11, background: "var(--bg-hover)", borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <div className="grid2">
        {[1, 2].map(i => (
          <div key={i} className="card" style={{ opacity: 0.6 }}>
            <div className="ch">
              <div style={{ width: 140, height: 11, background: "var(--bg-hover)", borderRadius: 4 }} />
            </div>
            <div className="cb" style={{ padding: "14px 16px" }}>
              {[1, 2, 3].map(j => (
                <div key={j} className="doc-item">
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg-hover)", flexShrink: 0 }} />
                  <div className="doc-info">
                    <div style={{ width: "60%", height: 10, background: "var(--bg-hover)", borderRadius: 4, marginBottom: 4 }} />
                    <div style={{ width: "80%", height: 13, background: "var(--bg-hover)", borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
