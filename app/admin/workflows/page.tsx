import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";

const typeLabels: Record<string, string> = {
  ORDER: "Приказ", DIRECTIVE: "Распоряжение", PROTOCOL: "Протокол",
  ACT: "Акт", MEMO: "Служебная записка", CONTRACT: "Договор", REPORT: "Отчёт",
};

export default async function WorkflowsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const templates = await prisma.workflowTemplate.findMany({
    include: {
      stages: { orderBy: { stageOrder: "asc" }, include: { approverPosition: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Шаблоны маршрутов</h1>
          <button className="btn btn-navy">
            <Plus className="w-4 h-4" />
            Создать шаблон
          </button>
        </div>

        <div className="space-y-4">
          {templates.map((t) => (
            <div key={t.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-[var(--text-primary)]">{t.name}</h2>
                  <p className="text-sm text-[var(--text-muted)]">{typeLabels[t.docType] || t.docType}</p>
                </div>
                <span className="text-sm text-[var(--text-muted)]">{t.stages.length} этапов</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {t.stages.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1">
                    <span className="px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                      {i + 1}. {s.approverPosition.name}
                      {s.deadlineDays ? ` (${s.deadlineDays}д)` : ""}
                    </span>
                    {i < t.stages.length - 1 && <span className="text-[var(--text-muted)] text-xs">→</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
