import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPendingApprovals } from "@/actions/documents";
import { Clock } from "lucide-react";
import { ClickableRow } from "@/components/ClickableRow";

const typeLabels: Record<string, string> = {
  ORDER: "Приказ", DIRECTIVE: "Распоряжение", PROTOCOL: "Протокол",
  ACT: "Акт", MEMO: "Служебная записка", CONTRACT: "Договор", REPORT: "Отчёт",
};

export default async function PendingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const pending = await getPendingApprovals(session.user.id);

  return (
    <div className="anim-fade-in space-y-4">
      <h1 className="doc-h1">На согласовании</h1>

      {pending.length === 0 ? (
        <div className="empty-state">
          <Clock size={32} style={{ color: "var(--text-muted)", marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
          <p>Нет документов, ожидающих решения</p>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Тип</th>
                <th>Название</th>
                <th>Автор</th>
                <th>Дата</th>
                <th>Этап</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((a) => (
                <ClickableRow key={a.id} href={`/documents/${a.document.id}`}>
                  <td>{typeLabels[a.document.type] || a.document.type}</td>
                  <td className="font-medium" style={{ color: "var(--accent)" }}>{a.document.title}</td>
                  <td>
                    {a.document.author.employee
                      ? `${a.document.author.employee.lastName} ${a.document.author.employee.firstName}`
                      : "—"}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {new Date(a.document.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td>
                    <span className="badge badge-warning">
                      Этап {a.stage?.stageOrder || "—"}
                    </span>
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
