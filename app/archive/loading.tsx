export default function ArchiveLoading() {
  return (
    <div className="anim-fade-in space-y-4">
      <div style={{ width: 200, height: 24, background: "var(--bg-hover)", borderRadius: 6 }} />
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ flex: 1, height: 36, background: "var(--bg-hover)", borderRadius: 8 }} />
        ))}
      </div>
      <div className="table-card">
        <table>
          <thead><tr>{[1, 2, 3, 4, 5, 6, 7].map(i => <th key={i}><div style={{ width: 60, height: 10, background: "var(--bg-hover)", borderRadius: 4 }} /></th>)}</tr></thead>
          <tbody>
            {[1, 2, 3, 4, 5].map(i => (
              <tr key={i}>
                {[1, 2, 3, 4, 5, 6, 7].map(j => <td key={j}><div style={{ width: j === 2 ? 100 : 50, height: 11, background: "var(--bg-hover)", borderRadius: 4 }} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
