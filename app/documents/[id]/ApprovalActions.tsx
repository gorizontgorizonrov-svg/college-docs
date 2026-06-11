"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitApproval, submitSignature } from "@/actions/workflow";
import { ThumbsUp, ThumbsDown, Undo, PenSquare } from "lucide-react";

interface ApprovalActionsProps {
  approvalId: string;
  canSign: boolean;
}

export function ApprovalActions({ approvalId, canSign }: ApprovalActionsProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (decision: "APPROVE" | "REJECT" | "RETURN_TO_AUTHOR") => {
    setIsLoading(true);
    setError(null);
    try {
      await submitApproval(approvalId, decision, comment);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await submitSignature(approvalId);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="approval-section">
      {error && (
        <div style={{ padding: "8px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: 8, fontSize: 12, color: "var(--danger)", marginBottom: 8 }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Комментарий</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="input"
          placeholder="Комментарий к решению..."
          style={{ minHeight: 60 }}
        />
      </div>

      <div className="act-row">
        <button onClick={() => handleAction("APPROVE")} disabled={isLoading} className="btn btn-green">
          <ThumbsUp size={16} />
          Согласовать
        </button>
        <button onClick={() => handleAction("RETURN_TO_AUTHOR")} disabled={isLoading} className="btn">
          <Undo size={16} />
          На доработку
        </button>
        <button onClick={() => handleAction("REJECT")} disabled={isLoading} className="btn btn-danger">
          <ThumbsDown size={16} />
          Отклонить
        </button>
        {canSign && (
          <button onClick={handleSign} disabled={isLoading} className="btn btn-navy">
            <PenSquare size={16} />
            Подписать ЭП
          </button>
        )}
      </div>
    </div>
  );
}
