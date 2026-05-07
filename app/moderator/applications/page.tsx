import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getApplicationsForModerator, getAllSpecialties } from "@/actions/moderator";
import { ArrowLeft, Search, Filter } from "lucide-react";
import Link from "next/link";

const statusLabels: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "Подано", color: "bg-gray-100 text-gray-700" },
  UNDER_REVIEW: { label: "На проверке", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Одобрено", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Отклонено", color: "bg-red-100 text-red-700" },
  ENROLLED: { label: "Зачислен", color: "bg-blue-100 text-blue-700" },
};

export default async function ModeratorApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; status?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "APPLICANT") {
    redirect("/applicant");
  }

  const params = await searchParams;
  const filters = {
    specialtyId: params.specialty,
    status: params.status as any,
    search: params.search,
  };

  const [applications, specialties] = await Promise.all([
    getApplicationsForModerator(filters),
    getAllSpecialties(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Link
            href="/moderator"
            className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Заявления</h1>
        </div>

        <form className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="search"
                defaultValue={params.search || ""}
                placeholder="Поиск по ФИО..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
            <select
              name="specialty"
              defaultValue={params.specialty || ""}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="">Все специальности</option>
              {specialties.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={params.status || ""}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="">Все статусы</option>
              {Object.entries(statusLabels).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 min-h-[44px]"
            >
              <Filter className="w-4 h-4" />
              Фильтр
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full hidden md:table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Абитуриент</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Специальность</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Статус</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Дата</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Документы</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Заявлений не найдено
                    </td>
                  </tr>
                ) : (
                  applications.map((app: any) => {
                    const docsVerified = app.applicant.documents.filter((d: any) => d.status === "VERIFIED").length;
                    const docsTotal = app.applicant.documents.length;
                    return (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/moderator/applications/${app.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {app.applicant.lastName} {app.applicant.firstName}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {app.applicant.user.phone}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-medium">{app.specialty.code}</span>
                          <p className="text-gray-500">{app.specialty.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${statusLabels[app.status]?.color}`}>
                            {statusLabels[app.status]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(app.submittedAt).toLocaleDateString("ru-RU")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={docsVerified === docsTotal ? "text-green-600" : "text-yellow-600"}>
                            {docsVerified}/{docsTotal}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-200">
            {applications.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-500">Заявлений не найдено</p>
            ) : (
              applications.map((app: any) => (
                <Link
                  key={app.id}
                  href={`/moderator/applications/${app.id}`}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {app.applicant.lastName} {app.applicant.firstName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {app.specialty.code} - {app.specialty.name}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${statusLabels[app.status]?.color}`}>
                      {statusLabels[app.status]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(app.submittedAt).toLocaleDateString("ru-RU")}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}