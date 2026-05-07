import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getEnrollmentStats } from "@/actions/reports";

export const dynamic = 'force-dynamic';

interface SpecialtyStat {
  id: string;
  code: string;
  name: string;
  budgetPlaces: number;
  contractPlaces: number;
  submitted: number;
  approved: number;
  enrolled: number;
  competition: string;
  fillPercent: number;
}

function StatsCard({ stat }: { stat: SpecialtyStat }) {
  const progressColor = stat.fillPercent >= 100 ? "bg-green-500" : stat.fillPercent >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
      <div className="font-medium">
        {stat.code} ({stat.name})
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Подано: {stat.submitted}</span>
        <span className="text-gray-500">Бюджет: {stat.budgetPlaces}</span>
        <span className="text-gray-500">Контракт: {stat.contractPlaces}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Одобрено: {stat.approved}</span>
        <span>Зачислено: {stat.enrolled}</span>
        <span>Конкурс: {stat.competition}</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Заполнение: {stat.fillPercent}%</span>
          <span className="text-gray-500">/ Бюджет</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${progressColor}`} style={{ width: `${Math.min(stat.fillPercent, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

export default async function StatsPage() {
  const stats = await getEnrollmentStats();
  const submittedTotal = stats.byStatus.SUBMITTED || 0;
  const approvedTotal = stats.byStatus.APPROVED || 0;
  const enrolledTotal = stats.byStatus.ENROLLED || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/moderator/reports" className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border hover:bg-gray-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Статистика</h1>
        </div>

        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="text-sm font-medium text-blue-800 mb-2">ИТОГО</div>
          <div className="flex justify-between text-blue-900">
            <span>Подано: {stats.total}</span>
            <span>Одобрено: {approvedTotal}</span>
            <span>Зачислено: {enrolledTotal}</span>
          </div>
        </div>

        <div className="space-y-3">
          {stats.specialtyStats.map((stat: SpecialtyStat) => (
            <StatsCard key={stat.id} stat={stat} />
          ))}
        </div>
      </div>
    </div>
  );
}