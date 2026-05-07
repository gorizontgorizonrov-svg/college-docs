import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import Link from "next/link";
import { ApplicationsForm } from "./ApplicationsForm";
import { getApplicantApplications } from "@/actions/applicant";
import { getApplicantProfile } from "@/actions/auth";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "APPLICANT") {
    redirect("/moderator");
  }

  const profile = await getApplicantProfile(session.user.id);
  const applications = await getApplicantApplications(session.user.id);

  if (applications.length > 0) {
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Мои заявления</h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 mb-4">Вы уже подали заявления:</p>
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {app.priority}. {app.specialty.name}
                    </p>
                    <p className="text-sm text-gray-500">Код: {app.specialty.code}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    app.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    app.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    app.status === "ENROLLED" ? "bg-blue-100 text-blue-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {app.status === "SUBMITTED" ? "Подано" :
                     app.status === "UNDER_REVIEW" ? "На проверке" :
                     app.status === "APPROVED" ? "Одобрено" :
                     app.status === "REJECTED" ? "Отклонено" :
                     app.status === "ENROLLED" ? "Зачислен" : app.status}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/applicant/status"
              className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
            >
              К статусу заявления
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Выбор специальности</h1>
        </div>

        {!profile && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700">
              Сначала заполните профиль абитуриента
            </p>
            <Link
              href="/applicant/profile/edit"
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 min-h-[44px]"
            >
              Заполнить профиль
            </Link>
          </div>
        )}

        {profile && <ApplicationsForm />}
      </div>
    </div>
  );
}