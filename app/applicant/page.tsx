import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getApplicantProfile } from "@/actions/auth";
import { getApplicantDocuments, getApplicantApplications } from "@/actions/applicant";
import Link from "next/link";
import { FileText, Send, ClipboardList, User, Plus, CheckCircle } from "lucide-react";

export default async function ApplicantPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "APPLICANT") {
    redirect("/moderator");
  }

  const profile = await getApplicantProfile(session.user.id);
  const applications = await getApplicantApplications(session.user.id);
  const documents = await getApplicantDocuments(session.user.id);

  const hasProfile = !!profile;
  const hasApplications = applications.length > 0;
  const hasDocuments = documents.length > 0;

  const docsVerified = documents.length > 0 && documents.every((d) => d.status === "VERIFIED");

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            Личный кабинет абитуриента
          </h1>
          <p className="text-gray-500">
            Добро пожаловать в систему подачи документов ЖАК ЖАГУ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/applicant/profile"
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
              hasProfile
                ? "border-green-200 bg-green-50 hover:border-green-300"
                : "border-yellow-200 bg-yellow-50 hover:border-yellow-300"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              hasProfile ? "bg-green-100" : "bg-yellow-100"
            }`}>
              {hasProfile ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <User className="w-6 h-6 text-yellow-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">Профиль</p>
              <p className="text-sm text-gray-500">
                {hasProfile ? "Заполнен" : "Не заполнен"}
              </p>
            </div>
          </Link>

          <Link
            href="/documents"
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
              hasDocuments
                ? "border-green-200 bg-green-50 hover:border-green-300"
                : "border-yellow-200 bg-yellow-50 hover:border-yellow-300"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              hasDocuments ? "bg-green-100" : "bg-yellow-100"
            }`}>
              {hasDocuments ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <FileText className="w-6 h-6 text-yellow-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">Документы</p>
              <p className="text-sm text-gray-500">
                {hasDocuments ? `${documents.length} загружено` : "Не загружены"}
              </p>
            </div>
          </Link>

          <Link
            href="/applicant/applications"
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
              hasApplications
                ? "border-green-200 bg-green-50 hover:border-green-300"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              hasApplications ? "bg-green-100" : "bg-gray-100"
            }`}>
              {hasApplications ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Send className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">Заявление</p>
              <p className="text-sm text-gray-500">
                {hasApplications ? "Подано" : "Не подано"}
              </p>
            </div>
          </Link>

          <Link
            href="/applicant/status"
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-colors ${
              hasApplications
                ? "border-blue-200 bg-blue-50 hover:border-blue-300"
                : "border-gray-200 bg-gray-50 hover:border-gray-300"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              hasApplications ? "bg-blue-100" : "bg-gray-100"
            }`}>
              <ClipboardList className={`w-6 h-6 ${hasApplications ? "text-blue-600" : "text-gray-500"}`} />
            </div>
            <div>
              <p className="font-medium text-gray-900">Статус</p>
              <p className="text-sm text-gray-500">
                {hasApplications ? "Проверить" : "После подачи"}
              </p>
            </div>
          </Link>
        </div>

        {!hasProfile && (
          <Link
            href="/applicant/profile/edit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            <Plus className="w-5 h-5" />
            Заполнить профиль
          </Link>
        )}

        {hasProfile && !hasDocuments && (
          <Link
            href="/documents"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            <Plus className="w-5 h-5" />
            Загрузить документы
          </Link>
        )}

        {hasProfile && hasDocuments && !hasApplications && (
          <Link
            href="/applicant/applications"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            <Plus className="w-5 h-5" />
            Подать заявление
          </Link>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Информация</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Подача документов: с 1 июня по 15 августа</li>
            <li>• При себе иметь оригиналы документов</li>
            <li>• Зачисление: до 25 августа</li>
          </ul>
        </div>
      </div>
    </div>
  );
}