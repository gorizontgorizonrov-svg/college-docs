import { Check, X, Minus, Timer, PenSquare } from "lucide-react";

const avatarColors = ["p1", "p2", "p3", "p4", "p5", "p6"];

function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return "??";
  return `${(firstName || "?")[0]}${(lastName || "?")[0]}`.toUpperCase();
}

function colorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

interface ApprovalTimelineProps {
  workflow: any;
  approvals: any[];
  signatures?: any[];
}

export function ApprovalTimeline({ workflow, approvals }: ApprovalTimelineProps) {
  const stages = workflow?.stages?.sort((a: any, b: any) => a.stageOrder - b.stageOrder) || [];

  if (stages.length === 0) {
    return <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Маршрут согласования не настроен</div>;
  }

  const activeStageOrder = (() => {
    for (const stage of stages) {
      const stageApprovals = approvals.filter((a: any) => a.stageId === stage.id);
      const allDecided = stageApprovals.length > 0 && stageApprovals.every((a: any) => a.decision !== null);
      if (!allDecided) return stage.stageOrder;
    }
    return stages.length + 1;
  })();

  return (
    <div>
      {stages.map((stage: any, idx: number) => {
        const stageApprovals = approvals.filter((a: any) => a.stageId === stage.id);
        const decided = stageApprovals.filter((a: any) => a.decision !== null);
        const allDecided = stageApprovals.length > 0 && stageApprovals.every((a: any) => a.decision !== null);
        const isCurrentStage = stage.stageOrder === activeStageOrder;
        const isFutureStage = stage.stageOrder > activeStageOrder;
        const isRejected = decided.some((a: any) => a.decision === "REJECT");
        const hasApprovers = stageApprovals.length > 0;
        const isSkipped = !hasApprovers && !isFutureStage;

        let nodeClass = "nd-skip";
        let nodeContent: React.ReactNode = <Minus size={14} />;
        let connClass = "c-gray";
        let statusChipClass = "cgy";
        let statusLabel = "Пропущен";
        let isActive = false;

        if (isSkipped) {
          nodeClass = "nd-skip";
          nodeContent = <Minus size={14} />;
          statusChipClass = "cgy";
          statusLabel = "Пропущен";
        } else if (isRejected) {
          nodeClass = "nd-wait";
          nodeContent = <X size={14} />;
          statusChipClass = "ca";
          statusLabel = "Отклонён";
        } else if (allDecided) {
          nodeClass = "nd-done";
          nodeContent = <Check size={14} />;
          statusChipClass = "cg";
          statusLabel = "Согласовано";
          connClass = "c-green";
        } else if (isCurrentStage) {
          nodeClass = "nd-act";
          nodeContent = <span className="pulse" />;
          statusChipClass = "cb2";
          statusLabel = "Текущий";
          isActive = true;
        } else if (isFutureStage) {
          nodeClass = "nd-skip";
          nodeContent = <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{stage.stageOrder}</span>;
          statusChipClass = "cgy";
          statusLabel = "Ожидание";
          connClass = "c-dash";
        }

        if (!isFutureStage && !isSkipped) connClass = "c-green";

        return (
          <div className="tl-row" key={stage.id}>
            <div className="tl-spine">
              <div className={`nd ${nodeClass}`}>{nodeContent}</div>
              {idx < stages.length - 1 && <div className={`conn ${connClass}`} />}
            </div>
            <div className="tl-body">
              <div className="tl-hdr">
                <span className="tl-stg">Этап {stage.stageOrder}</span>
                <span className={`chip ${statusChipClass}`}>{statusLabel}</span>
                {isActive && <span className="tl-cur">· текущий</span>}
              </div>
              <div className="tl-meta">
                {stage.deadlineDays && (
                  <span><Timer size={14} />{stage.deadlineDays} дн.</span>
                )}
                {decided.length > 0 && decided[0]?.decidedAt && (
                  <span>{new Date(decided[0].decidedAt).toLocaleDateString("ru-RU")}</span>
                )}
              </div>

              {stageApprovals.map((approval: any) => {
                const emp = approval.approver?.employee;

                return (
                  <div className="pr" key={approval.id}>
                    <div className={`pav ${colorFor(approval.approverId)}`}>
                      {getInitials(emp?.firstName, emp?.lastName)}
                    </div>
                    <div className="pi">
                      <div className="pname">
                        {emp ? `${emp.lastName} ${emp.firstName}` : approval.approver?.email || "Unknown"}
                      </div>
                      <div className="prole">
                        {approval.decision === "APPROVE" && "Согласовал(а)"}
                        {approval.decision === "REJECT" && "Отклонил(а)"}
                        {approval.decision === "RETURN_TO_AUTHOR" && "Вернул(а)"}
                        {!approval.decision && (isCurrentStage ? "Ожидает вашего решения" : "Ожидает очереди")}
                        {approval.comment && ` — ${approval.comment}`}
                      </div>
                    </div>
                  </div>
                );
              })}

              {stageApprovals.map((approval: any) =>
                approval.signature ? (
                  <div className="ep" key={`sig-${approval.id}`}>
                    <PenSquare size={14} />
                    Подписано ЭП · {new Date(approval.signature.createdAt || approval.decidedAt).toLocaleDateString("ru-RU")}
                  </div>
                ) : null
              )}

              {!isSkipped && stageApprovals.length === 0 && (
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>Нет согласующих</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
