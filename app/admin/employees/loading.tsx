export default function EmployeesLoading() {
  return (
    <div className="anim-fade-in space-y-4">
      <div style={{ width: 240, height: 24, background: "var(--bg-hover)", borderRadius: 6 }} />
      <div className="table-card">
        <table>
          <thead><tr>{[1, 2, 3, 4, 5, 6].map(i => <th key={i}><div style={{ width: 70, height: 10, background: "var(--bg-hover)", borderRadius: 4 }} /></th>)}</tr></thead>
          <tbody>
            {[1, 2, 3, 4].map(i => (
              <tr key={i}>
                {[1, 2, 3, 4, 5, 6].map(j => <td key={j}><div style={{ width: j === 0 ? 140 : 70, height: 11, background: "var(--bg-hover)", borderRadius: 4 }} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
