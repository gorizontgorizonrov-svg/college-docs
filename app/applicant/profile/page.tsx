import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getApplicantProfile } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, User, Mail, Phone, Calendar, GraduationCap } from "lucide-react";
import Link from "next/link";

export default async function ApplicantProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const profile = await getApplicantProfile(session.user.id);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="flex items-center gap-4">
            <Link
              href="/applicant"
              className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Профиль</h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Профиль не заполнен</p>
            <Link
              href="/applicant/profile/edit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
            >
              Заполнить профиль
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const certTypeLabels: Record<string, string> = {
    GRADE_9: "Аттестат 9 класса",
    GRADE_11: "Аттестат 11 класса",
  };

  const statusLabels: Record<string, string> = {
    SUBMITTED: "Подано",
    UNDER_REVIEW: "На проверке",
    APPROVED: "Одобрено",
    REJECTED: "Отклонено",
    ENROLLED: "Зачислен",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Link
            href="/applicant"
            className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Профиль</h1>
          <Link
            href="/applicant/profile/edit"
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            Редактировать
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {profile.lastName} {profile.firstName}
              </h2>
              {profile.middleName && (
                <p className="text-gray-500">{profile.middleName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Телефон</p>
                <p className="text-sm font-medium">{profile.phoneNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Дата рождения</p>
                <p className="text-sm font-medium">
                  {new Date(profile.birthDate).toLocaleDateString("ru-RU")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Тип аттестата</p>
                <p className="text-sm font-medium">{certTypeLabels[profile.schoolCertType]}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Средний балл</p>
                <p className="text-sm font-medium">{Number(profile.avgGrade).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Мои заявления</h3>
          {profile.applications.length === 0 ? (
            <p className="text-gray-500 text-sm">Заявления не поданы</p>
          ) : (
            <div className="space-y-3">
              {profile.applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {app.priority}. {app.specialty.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Код: {app.specialty.code}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      app.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : app.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : app.status === "ENROLLED"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {statusLabels[app.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Мои документы</h3>
          {profile.documents.length === 0 ? (
            <p className="text-gray-500 text-sm">Документы не загружены</p>
          ) : (
            <div className="space-y-2">
              {profile.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{doc.type}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.uploadedAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      doc.status === "VERIFIED"
                        ? "bg-green-100 text-green-700"
                        : doc.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {doc.status === "VERIFIED" ? "Проверено" : doc.status === "REJECTED" ? "Отклонено" : "На проверке"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}