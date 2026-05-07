import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getEnrollmentStats, getEnrollmentRanking } from "@/actions/reports";
import { ArrowLeft, FileSpreadsheet, Users, BarChart3, Play, Printer, ClipboardList } from "lucide-react";
import Link from "next/link";
import EnrollmentButton from "./EnrollmentButton";

export default async function ModeratorReportsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "APPLICANT") {
    redirect("/applicant");
  }

  const stats = await getEnrollmentStats();

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
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Отчеты</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Всего заявлений</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Одобрено</p>
            <p className="text-2xl font-bold text-green-600">{stats.byStatus["APPROVED"] || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Отклонено</p>
            <p className="text-2xl font-bold text-red-600">{stats.byStatus["REJECTED"] || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Средний балл</p>
            <p className="text-2xl font-bold text-blue-600">{stats.avgGrade}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            href="/moderator/reports/export"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-medium">Экспорт заявлений</p>
              <p className="text-sm text-gray-500">Скачать в Excel</p>
            </div>
          </Link>

          <Link
            href="/moderator/reports/ranking"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-medium">Рейтинг поступающих</p>
              <p className="text-sm text-gray-500">Сортировка по баллам</p>
            </div>
          </Link>

          <Link
            href="/moderator/reports/stats"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <div>
              <p className="font-medium">Статистика</p>
              <p className="text-sm text-gray-500">По специальностям</p>
            </div>
          </Link>

          <Link
            href="/moderator/reports/export/enrolled"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-medium">Экспорт зачисленных</p>
              <p className="text-sm text-gray-500">Скачать в Excel</p>
            </div>
          </Link>

          <Link
            href="/moderator/reports/print-orders"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <Printer className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-medium">Печать приказов</p>
              <p className="text-sm text-gray-500">Приказы о зачислении</p>
            </div>
          </Link>

          <Link
            href="/moderator/audit-log"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <ClipboardList className="w-8 h-8 text-orange-600" />
            <div>
              <p className="font-medium">Журнал аудита</p>
              <p className="text-sm text-gray-500">История действий</p>
            </div>
          </Link>
        </div>

        <EnrollmentButton />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Места по специальностям</h2>
          <div className="space-y-2">
            {stats.specialtyStats.map((spec: any) => (
              <div key={spec.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{spec.code} - {spec.name}</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-green-600">Бюджет: {spec.budgetPlaces}</span>
                  <span className="text-blue-600">Контракт: {spec.contractPlaces}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}