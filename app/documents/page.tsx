import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getApplicantDocuments, createDocument, deleteDocument } from "@/actions/applicant";
import { ArrowLeft, Plus, Trash2, FileText, Upload, Image, Check, X } from "lucide-react";
import Link from "next/link";

const docTypeLabels: Record<string, { label: string; required: boolean }> = {
  SCHOOL_CERT: { label: "Аттестат/свидетельство", required: true },
  PASSPORT: { label: "Паспорт", required: true },
  MED_FORM_086: { label: "Справка 086", required: true },
  MILITARY_DOC: { label: "Приписное свидетельство", required: false },
  PHOTO: { label: "Фото 3x4", required: true },
  OTHER: { label: "Другое", required: false },
};

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "APPLICANT") {
    redirect("/moderator");
  }

  const documents = await getApplicantDocuments(session.user.id);
  const requiredTypes = ["SCHOOL_CERT", "PASSPORT", "MED_FORM_086", "PHOTO"];
  const uploadedTypes = documents.map((d) => d.type);
  const missingRequired = requiredTypes.filter((t) => !uploadedTypes.includes(t as any));

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/applicant"
            className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Мои документы</h1>
          <div className="w-10" />
        </div>

        {missingRequired.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700">
              Для подачи заявления необходимо загрузить:{" "}
              {missingRequired.map((t) => docTypeLabels[t]?.label).filter(Boolean).join(", ")}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {Object.entries(docTypeLabels).map(([type, { label, required }]) => {
            const doc = documents.find((d) => d.type === type);
            return (
              <div
                key={type}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {type === "PHOTO" ? (
                        <Image className="w-5 h-5 text-gray-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      {doc && (
                        <p className="text-xs text-gray-500">
                          {doc.fileName} ({(doc.fileSize / 1024).toFixed(1)} КБ)
                        </p>
                      )}
                    </div>
                  </div>
                  {doc ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          doc.status === "VERIFIED"
                            ? "bg-green-100 text-green-700"
                            : doc.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {doc.status === "VERIFIED"
                          ? "Проверено"
                          : doc.status === "REJECTED"
                          ? "Отклонено"
                          : "На проверке"}
                      </span>
                      <Link
                        href={`/documents/${doc.id}/edit`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        Заменить
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/documents/upload?type=${type}`}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
                    >
                      <Upload className="w-4 h-4" />
                      Загрузить
                    </Link>
                  )}
                </div>
                {doc?.rejectionReason && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                    Причина отклонения: {doc.rejectionReason}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Требования к документам:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Формат: JPEG, PNG или PDF</li>
            <li>• Размер: не более 10 МБ</li>
            <li>• Качество: readable, без бликов</li>
            <li>• Фото: 3x4, цветное</li>
          </ul>
        </div>
      </div>
    </div>
  );
}