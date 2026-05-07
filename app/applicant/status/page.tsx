import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getApplicationStatus } from "@/actions/applicant";
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle, FileCheck, FileX, Files } from "lucide-react";
import Link from "next/link";

const statusSteps = [
  { key: "SUBMITTED", label: "Заявление подано", icon: Files },
  { key: "UNDER_REVIEW", label: "На проверке", icon: Clock },
  { key: "APPROVED", label: "Одобрено", icon: CheckCircle },
  { key: "ENROLLED", label: "Зачислен", icon: AlertCircle },
];

export default async function StatusPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "APPLICANT") {
    redirect("/moderator");
  }

  const status = await getApplicationStatus(session.user.id);

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="flex items-center gap-4">
            <Link href="/applicant" className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Статус заявления</h1>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Заявление не подано</p>
            <Link href="/applicant/applications" className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 min-h-[44px]">
              Подать заявление
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { applications, documents, overallStatus } = status;

  const currentStepIndex = statusSteps.findIndex((s) => s.key === overallStatus);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/applicant" className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Статус заявления</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-lg font-semibold">Этап:</span>
            <span className="text-lg font-bold text-blue-600">{statusSteps[currentStepIndex]?.label}</span>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isComplete = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step.key} className="relative flex items-center gap-3 pl-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      isComplete ? "bg-green-500" : isCurrent ? "bg-blue-500" : "bg-gray-200"
                    }`}>
                      {isComplete ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : isCurrent ? (
                        <Icon className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-sm text-gray-500">{index + 1}</span>
                      )}
                    </div>
                    <span className={isCurrent ? "font-medium text-gray-900" : isComplete ? "text-gray-600" : "text-gray-400"}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {overallStatus === "REJECTED" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              <p className="font-medium">Заявление отклонено</p>
            </div>
            <p className="text-sm text-red-600 mt-1">Обратитесь в приемную комиссию для уточнения причин.</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Мои заявления</h3>
          <div className="space-y-2">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{app.priority}. {app.specialty.name}</p>
                  <p className="text-sm text-gray-500">{app.specialty.code}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  app.status === "APPROVED" ? "bg-green-100 text-green-700" :
                  app.status === "REJECTED" ? "bg-red-100 text-red-700" :
                  app.status === "ENROLLED" ? "bg-blue-100 text-blue-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Документы</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{doc.type}</p>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  doc.status === "VERIFIED" ? "bg-green-100 text-green-700" :
                  doc.status === "REJECTED" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {doc.status === "VERIFIED" ? "Проверено" :
                   doc.status === "REJECTED" ? "Отклонено" : "На проверке"}
                </span>
              </div>
            ))}
          </div>
          <Link href="/documents" className="mt-3 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 min-h-[44px]">
            К документам
          </Link>
        </div>
      </div>
    </div>
  );
}