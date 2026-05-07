"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Check, X, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getInternalDocumentById, submitApproval } from "@/actions/internal-docs";
import { useSession } from "next-auth/react";
import type { ReviewDecision } from "@prisma/client";

const statusLabels: Record<string, string> = {
  PENDING: "На рассмотрении",
  VERIFIED: "Утвержден",
  REJECTED: "Отклонен",
};

const typeLabels: Record<string, string> = {
  ORDER: "Приказ",
  DIRECTIVE: "Распоряжение",
  PROTOCOL: "Протокол",
  ACT: "Акт",
  MEMO: "Служебная записка",
  CONTRACT: "Договор",
  REPORT: "Отчет",
};

const decisionLabels: Record<string, string> = {
  APPROVE: "Утверждено",
  REJECT: "Отклонено",
  REQUEST_INFO: "Запрошена информация",
};

export default function InternalDocDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = use(params);
  const [document, setDocument] = useState<any>(null);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState<ReviewDecision | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useState(() => {
    getInternalDocumentById(id).then(setDocument);
  });

  const currentUserId = session?.user?.id;
  const isApprover = document?.approvals?.some(
    (a: any) => a.approverId === currentUserId && !a.decision
  );

  const handleApproval = async () => {
    if (!approvalDecision) return;
    setIsLoading(true);
    try {
      await submitApproval(id, approvalDecision, approvalComment || undefined);
      router.refresh();
      setShowApprovalForm(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-4 flex items-center justify-center">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Link
            href="/internal-docs"
            className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Документ</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">{document.title}</h2>
              <p className="text-sm text-gray-500">
                {typeLabels[document.type]}
                {document.number && ` № ${document.number}`}
              </p>
            </div>
            <span
              className={`inline-flex px-3 py-1 text-sm rounded-full ${
                document.status === "VERIFIED"
                  ? "bg-green-100 text-green-700"
                  : document.status === "REJECTED"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {statusLabels[document.status]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Автор:</p>
              <p className="font-medium">
                {document.author?.moderator
                  ? `${document.author.moderator.firstName} ${document.author.moderator.lastName}`
                  : document.author?.email || document.author?.phone}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Дата создания:</p>
              <p className="font-medium">
                {new Date(document.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {document.content && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Текст документа:</p>
              <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm">
                {document.content}
              </div>
            </div>
          )}

          {document.fileUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Прикрепленный файл:</p>
              <a
                href={document.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <FileText className="w-4 h-4" />
                Скачать файл
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Согласующие</h3>
          <div className="space-y-3">
            {document.approvals?.length === 0 ? (
              <p className="text-gray-500 text-sm">Нет согласующих</p>
            ) : (
              document.approvals?.map((approval: any) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {approval.decision === "APPROVE" ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : approval.decision === "REJECT" ? (
                      <X className="w-5 h-5 text-red-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {approval.approver?.moderator
                          ? `${approval.approver.moderator.firstName} ${approval.approver.moderator.lastName}`
                          : approval.approver?.email || approval.approver?.phone}
                      </p>
                      {approval.comment && (
                        <p className="text-xs text-gray-500 mt-1">{approval.comment}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-sm ${
                      approval.decision === "APPROVE"
                        ? "text-green-600"
                        : approval.decision === "REJECT"
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {approval.decision
                      ? decisionLabels[approval.decision]
                      : "Ожидает рассмотрения"}
                  </span>
                </div>
              ))
            )}
          </div>

          {isApprover && !showApprovalForm && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setApprovalDecision("APPROVE");
                  setShowApprovalForm(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors min-h-[44px]"
              >
                <Check className="w-5 h-5" />
                Утвердить
              </button>
              <button
                onClick={() => {
                  setApprovalDecision("REJECT");
                  setShowApprovalForm(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors min-h-[44px]"
              >
                <X className="w-5 h-5" />
                Отклонить
              </button>
            </div>
          )}

          {showApprovalForm && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Комментарий (необязательно)
                </label>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  rows={3}
                  placeholder="Добавьте комментарий..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApproval}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px] disabled:opacity-50"
                >
                  {isLoading ? "Сохранение..." : "Подтвердить"}
                </button>
                <button
                  onClick={() => setShowApprovalForm(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors min-h-[44px]"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}