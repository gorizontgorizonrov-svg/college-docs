export default function DocumentDetailLoading() {
  return (
    <div className="anim-fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {[1, 2, 3].map(i => <div key={i} style={{ width: 80, height: 11, background: "var(--bg-hover)", borderRadius: 4 }} />)}
      </div>
      <div style={{ width: "60%", height: 22, background: "var(--bg-hover)", borderRadius: 6, marginBottom: 4 }} />
      <div className="stats">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="st" style={{ opacity: 0.6 }}>
            <div style={{ width: 60, height: 10, background: "var(--bg-hover)", borderRadius: 4, marginBottom: 6 }} />
            <div style={{ width: 40, height: 22, background: "var(--bg-hover)", borderRadius: 4, marginBottom: 4 }} />
            <div style={{ width: 90, height: 10, background: "var(--bg-hover)", borderRadius: 4 }} />
          </div>
        ))}
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="card" style={{ opacity: 0.6 }}>
          <div className="ch"><div style={{ width: 120, height: 11, background: "var(--bg-hover)", borderRadius: 4 }} /></div>
          <div className="cb"><div style={{ width: "80%", height: 40, background: "var(--bg-hover)", borderRadius: 4 }} /></div>
        </div>
      ))}
    </div>
  );
}
