import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getModeratorDashboard } from "@/actions/moderator";
import { FileText, Users, CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

const statusLabels: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "Подано", color: "bg-gray-100 text-gray-700" },
  UNDER_REVIEW: { label: "На проверке", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Одобрено", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Отклонено", color: "bg-red-100 text-red-700" },
  ENROLLED: { label: "Зачислен", color: "bg-blue-100 text-blue-700" },
};

export default async function ModeratorDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "APPLICANT") {
    redirect("/applicant");
  }

  const { stats, recentApplications, specialties } = await getModeratorDashboard();

  const pendingCount = (stats.byStatus["SUBMITTED"] || 0) + (stats.byStatus["UNDER_REVIEW"] || 0);
  const approvedCount = stats.byStatus["APPROVED"] || 0;
  const rejectedCount = stats.byStatus["REJECTED"] || 0;
  const enrolledCount = stats.byStatus["ENROLLED"] || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Панель модератора</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Ожидают</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Одобрено</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xs">Отклонено</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Зачислено</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{enrolledCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            href="/moderator/applications"
            className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <span className="font-medium">Заявления</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </Link>

          <Link
            href="/internal-docs"
            className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <span className="font-medium">Внутренние документы</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Последние заявления</h2>
          {recentApplications.length === 0 ? (
            <p className="text-gray-500 text-sm">Заявлений пока нет</p>
          ) : (
            <div className="space-y-2">
              {recentApplications.map((app: any) => (
                <Link
                  key={app.id}
                  href={`/moderator/applications/${app.id}`}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {app.applicant.lastName} {app.applicant.firstName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {app.specialty.name} • {new Date(app.submittedAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    app.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    app.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    app.status === "ENROLLED" ? "bg-blue-100 text-blue-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {statusLabels[app.status]?.label || app.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}