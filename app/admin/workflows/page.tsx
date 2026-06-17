import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IconPlus, IconGitBranch } from "@tabler/icons-react";

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
    <div className="anim-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="doc-h1">Шаблоны маршрутов</h1>
        <button className="btn btn-navy">
          <IconPlus size={16} />
          Создать шаблон
        </button>
      </div>

      <div className="anim-stagger" style={{ display: "grid", gap: 8 }}>
        {templates.map((t) => (
          <div key={t.id} className="card" style={{ padding: 16 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="doc-ico ic-purple"><IconGitBranch size={14} /></div>
                <div>
                  <div className="doc-name">{t.name}</div>
                  <div className="doc-type">{typeLabels[t.docType] || t.docType}</div>
                </div>
              </div>
              <span className="badge badge-info">{t.stages.length} этапов</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {t.stages.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1">
                  <span className="chip cb2">
                    {i + 1}. {s.approverPosition.name}
                    {s.deadlineDays ? ` (${s.deadlineDays}д)` : ""}
                  </span>
                  {i < t.stages.length - 1 && (
                    <span style={{ color: "var(--text-muted)", fontSize: 12 }}>→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
