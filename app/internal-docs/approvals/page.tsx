"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Check, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getPendingApprovals, submitApproval } from "@/actions/internal-docs";
import type { ReviewDecision } from "@prisma/client";

const typeLabels: Record<string, string> = {
  ORDER: "Приказ",
  DIRECTIVE: "Распоряжение",
  PROTOCOL: "Протокол",
  ACT: "Акт",
  MEMO: "Служебная записка",
  CONTRACT: "Договор",
  REPORT: "Отчет",
};

export default function ApprovalsPage() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    getPendingApprovals().then((data) => {
      setApprovals(data);
      setIsLoading(false);
    });
  }, []);

  const handleDecision = async (documentId: string) => {
    if (!decision) return;
    setProcessing(documentId);
    try {
      await submitApproval(documentId, decision, comment || undefined);
      setApprovals(approvals.filter((a) => a.documentId !== documentId));
      setShowForm(null);
      setComment("");
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-4 flex items-center justify-center">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Согласования</h1>

        {approvals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Нет документов на согласование</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((approval) => (
              <div
                key={approval.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
              >
                {showForm === approval.documentId ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {approval.document.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {typeLabels[approval.document.type]}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Автор:{" "}
                          {approval.document.author?.moderator
                            ? `${approval.document.author.moderator.firstName} ${approval.document.author.moderator.lastName}`
                            : approval.document.author?.email ||
                              approval.document.author?.phone}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Комментарий (необязательно)"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setDecision("APPROVE");
                          handleDecision(approval.documentId);
                        }}
                        disabled={processing === approval.documentId}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 min-h-[44px] disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        Утвердить
                      </button>
                      <button
                        onClick={() => {
                          setDecision("REJECT");
                          handleDecision(approval.documentId);
                        }}
                        disabled={processing === approval.documentId}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 min-h-[44px] disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Отклонить
                      </button>
                      <button
                        onClick={() => setShowForm(null)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 min-h-[44px]"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {approval.document.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {typeLabels[approval.document.type]}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Автор:{" "}
                          {approval.document.author?.moderator
                            ? `${approval.document.author.moderator.firstName} ${approval.document.author.moderator.lastName}`
                            : approval.document.author?.email ||
                              approval.document.author?.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/internal-docs/${approval.documentId}`}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setShowForm(approval.documentId)}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 min-h-[44px]"
                      >
                        Рассмотреть
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}