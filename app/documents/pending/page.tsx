import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPendingApprovals } from "@/actions/documents";
import Link from "next/link";
import { Clock } from "lucide-react";

const typeLabels: Record<string, string> = {
  ORDER: "Приказ", DIRECTIVE: "Распоряжение", PROTOCOL: "Протокол",
  ACT: "Акт", MEMO: "Служебная записка", CONTRACT: "Договор", REPORT: "Отчёт",
};

export default async function PendingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const pending = await getPendingApprovals(session.user.id);

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">На согласовании</h1>

        {pending.length === 0 ? (
          <div className="card p-12 text-center">
            <Clock className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-muted)] text-lg">Нет документов, ожидающих решения</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className=" border-b border-[var(--border-subtle)]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Тип</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Название</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Автор</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Дата</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Этап</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {pending.map((a) => (
                    <tr key={a.id} className="hover:bg-[var(--bg-secondary)]">
                      <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{typeLabels[a.document.type] || a.document.type}</td>
                      <td className="px-4 py-3">
                        <Link href={`/documents/${a.document.id}`} className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
                          {a.document.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                        {a.document.author.employee
                          ? `${a.document.author.employee.lastName} ${a.document.author.employee.firstName}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                        {new Date(a.document.createdAt).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge-warning px-2 py-1 text-xs rounded-full">
                          Этап {a.stage?.stageOrder || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
