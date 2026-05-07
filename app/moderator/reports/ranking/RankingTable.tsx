"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { runEnrollmentAlgorithm } from "@/actions/reports";

interface Specialty {
  id: string;
  code: string;
  name: string;
}

interface RankingEntry {
  id: string;
  status: string;
  rank: number;
  specialty: { id: string; code: string; name: string };
  applicant: { firstName: string; lastName: string; middleName: string | null; avgGrade: number };
}

export default function RankingTable({ ranking, specialties }: { ranking: RankingEntry[]; specialties: Specialty[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const selectedSpecialty = searchParams.get("specialty") || "";

  const handleSpecialtyChange = (specialtyId: string) => {
    const params = new URLSearchParams(searchParams);
    if (specialtyId) {
      params.set("specialty", specialtyId);
    } else {
      params.delete("specialty");
    }
    router.push(`/moderator/reports/ranking?${params.toString()}`);
  };

  const handleEnroll = async () => {
    if (!confirm("Запустить алгоритм зачисления? Это распределит абитуриентов по бюджетным местам.")) {
      return;
    }
    startTransition(async () => {
      const result = await runEnrollmentAlgorithm();
      alert(`Зачислено: ${result.enrolledCount} абитуриентов`);
      router.refresh();
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Одобр.";
      case "ENROLLED":
        return "Зачислен";
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "ENROLLED":
        return "bg-green-100 text-green-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/moderator/reports" className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border hover:bg-gray-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Рейтинг поступающих</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <label className="block text-sm font-medium mb-2">Специальность</label>
          <select
            value={selectedSpecialty}
            onChange={(e) => handleSpecialtyChange(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg min-h-[44px]"
          >
            <option value="">Все</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
            ))}
          </select>
        </div>

        <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ФИО</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Специальность</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Балл</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((entry) => (
                <tr key={entry.id} className="border-b">
                  <td className="px-4 py-3">{entry.rank}</td>
                  <td className="px-4 py-3">
                    {entry.applicant.lastName} {entry.applicant.firstName}
                  </td>
                  <td className="px-4 py-3 text-sm">{entry.specialty.code}</td>
                  <td className="px-4 py-3 font-bold text-lg">{entry.applicant.avgGrade.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(entry.status)}`}>
                      {getStatusLabel(entry.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {ranking.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">#{entry.rank}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(entry.status)}`}>
                  {getStatusLabel(entry.status)}
                </span>
              </div>
              <div className="font-medium">
                {entry.applicant.lastName} {entry.applicant.firstName}
              </div>
              <div className="text-sm text-gray-500">{entry.specialty.code} - {entry.specialty.name}</div>
              <div className="text-xl font-bold mt-2">{entry.applicant.avgGrade.toFixed(2)}</div>
            </div>
          ))}
        </div>

        <button
          onClick={handleEnroll}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 min-h-[44px] disabled:opacity-50"
        >
          <GraduationCap className="w-5 h-5" />
          {isPending ? "Зачисление..." : "Запустить зачисление"}
        </button>
      </div>
    </div>
  );
}