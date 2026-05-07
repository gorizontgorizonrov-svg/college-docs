"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Check, X, HelpCircle, FileText, Image, User, Phone, Calendar, Save } from "lucide-react";
import Link from "next/link";
import { submitModeratorReview, updateDocStatus } from "@/actions/moderator";
import { useSession } from "next-auth/react";
import type { ReviewDecision, DocStatus } from "@prisma/client";

const reviewSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_INFO"]),
  comment: z.string().optional(),
});

const docStatusSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

type ReviewForm = z.infer<typeof reviewSchema>;
type DocStatusForm = z.infer<typeof docStatusSchema>;

interface ApplicationDetailsProps {
  application: any;
}

export function ApplicationDetails({ application }: ApplicationDetailsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [submittingReview, setSubmittingReview] = useState(false);
  const [updatingDoc, setUpdatingDoc] = useState<string | null>(null);

  const {
    register: registerReview,
    handleSubmit: handleReviewSubmit,
    formState: { errors: reviewErrors },
    reset: resetReview,
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
  });

  const {
    register: registerDoc,
    handleSubmit: handleDocSubmit,
    formState: { errors: docErrors },
    reset: resetDoc,
  } = useForm<DocStatusForm>({
    resolver: zodResolver(docStatusSchema),
  });

  const handleReview = async (data: ReviewForm) => {
    if (!session?.user?.id) return;
    setSubmittingReview(true);

    try {
      await submitModeratorReview({
        applicationId: application.id,
        moderatorId: session.user.id,
        decision: data.decision,
        comment: data.comment,
      });
      router.refresh();
      resetReview();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDocUpdate = async (docId: string, data: DocStatusForm) => {
    setUpdatingDoc(docId);

    try {
      await updateDocStatus({
        documentId: docId,
        status: data.status,
        rejectionReason: data.rejectionReason,
      });
      router.refresh();
      resetDoc();
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingDoc(null);
    }
  };

  const certTypeLabel = application.applicant.schoolCertType === "GRADE_9" ? "9 класс" : "11 класс";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Абитуриент</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">ФИО</p>
            <p className="font-medium">
              {application.applicant.lastName} {application.applicant.firstName}
              {application.applicant.middleName && ` ${application.applicant.middleName}`}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Телефон</p>
            <p className="font-medium">{application.applicant.phoneNumber}</p>
          </div>
          <div>
            <p className="text-gray-500">Дата рождения</p>
            <p className="font-medium">
              {new Date(application.applicant.birthDate).toLocaleDateString("ru-RU")}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Аттестат</p>
            <p className="font-medium">{certTypeLabel}</p>
          </div>
          <div>
            <p className="text-gray-500">Средний балл</p>
            <p className="font-medium">{application.applicant.avgGrade}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Заявление</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {application.priority}. {application.specialty.name}
            </p>
            <p className="text-sm text-gray-500">Код: {application.specialty.code}</p>
          </div>
          <span className={`px-3 py-1 text-sm rounded-full ${
            application.status === "APPROVED" ? "bg-green-100 text-green-700" :
            application.status === "REJECTED" ? "bg-red-100 text-red-700" :
            application.status === "ENROLLED" ? "bg-blue-100 text-blue-700" :
            "bg-yellow-100 text-yellow-700"
          }`}>
            {application.status === "SUBMITTED" ? "Подано" :
             application.status === "UNDER_REVIEW" ? "На проверке" :
             application.status === "APPROVED" ? "Одобрено" :
             application.status === "REJECTED" ? "Отклонено" :
             application.status === "ENROLLED" ? "Зачислен" : application.status}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Документы</h2>
        <div className="space-y-3">
          {application.applicant.documents.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {doc.mimeType?.startsWith("image/") ? (
                  <Image className="w-5 h-5 text-gray-500" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <p className="font-medium text-sm">{doc.type}</p>
                  <p className="text-xs text-gray-500">
                    {doc.fileName} ({(doc.fileSize / 1024).toFixed(1)} КБ)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  doc.status === "VERIFIED" ? "bg-green-100 text-green-700" :
                  doc.status === "REJECTED" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {doc.status === "VERIFIED" ? "Проверено" :
                   doc.status === "REJECTED" ? "Отклонено" : "На проверке"}
                </span>
                <Link
                  href={`/moderator/applications/${application.id}/documents/${doc.id}`}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  Просмотр
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Решение</h2>
        <form onSubmit={handleReviewSubmit(handleReview)} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 p-3 border-2 border-green-200 rounded-lg cursor-pointer hover:bg-green-50">
              <input type="radio" value="APPROVE" {...registerReview("decision")} className="w-4 h-4 text-green-600" />
              <Check className="w-4 h-4 text-green-600" />
              <span className="font-medium">Одобрить</span>
            </label>
            <label className="flex items-center gap-2 p-3 border-2 border-red-200 rounded-lg cursor-pointer hover:bg-red-50">
              <input type="radio" value="REJECT" {...registerReview("decision")} className="w-4 h-4 text-red-600" />
              <X className="w-4 h-4 text-red-600" />
              <span className="font-medium">Отклонить</span>
            </label>
            <label className="flex items-center gap-2 p-3 border-2 border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-50">
              <input type="radio" value="REQUEST_INFO" {...registerReview("decision")} className="w-4 h-4 text-yellow-600" />
              <HelpCircle className="w-4 h-4 text-yellow-600" />
              <span className="font-medium">Запросить info</span>
            </label>
          </div>

          {reviewErrors.decision && (
            <p className="text-red-500 text-sm">{reviewErrors.decision.message}</p>
          )}

          <textarea
            {...registerReview("comment")}
            placeholder="Комментарий (обязательно для запроса информации)"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <button
            type="submit"
            disabled={submittingReview}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px] disabled:opacity-50"
          >
            {submittingReview ? (
              <span>Сохранение...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Отправить решение
              </>
            )}
          </button>
        </form>
      </div>

      {application.reviews.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">История проверок</h2>
          <div className="space-y-2">
            {application.reviews.map((review: any) => (
              <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">
                    {review.moderator.firstName} {review.moderator.lastName}
                  </p>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    review.decision === "APPROVE" ? "bg-green-100 text-green-700" :
                    review.decision === "REJECT" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {review.decision === "APPROVE" ? "Одобрено" :
                     review.decision === "REJECT" ? "Отклонено" :
                     review.decision === "REQUEST_INFO" ? "Запрошена инфо" : review.decision}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(review.createdAt).toLocaleString("ru-RU")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}