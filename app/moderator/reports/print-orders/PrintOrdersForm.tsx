"use client";

import { useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

interface Specialty {
  id: string;
  code: string;
  name: string;
}

interface EnrolledApp {
  id: string;
  specialty: Specialty;
  applicant: { firstName: string; lastName: string; middleName: string | null; avgGrade: number };
}

export default function PrintOrdersForm({ specs, enrolled }: { specs: Specialty[]; enrolled: EnrolledApp[] }) {
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  const filtered = selectedSpecialty
    ? enrolled.filter((e) => e.specialty.id === selectedSpecialty)
    : enrolled;

  const handlePrint = () => {
    window.print();
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const year = today.getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/moderator/reports" className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border hover:bg-gray-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Печать приказов</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <label className="block text-sm font-medium mb-2">Специальность</label>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg min-h-[44px]"
          >
            <option value="">Все</option>
            {specs.map((s) => (
              <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 print:shadow-none print:border-0">
          <div className="print-only hidden mb-6">
            <h2 className="text-center text-lg font-bold mb-4">ЖАЛ-АБАДСКИЙ КОЛЛЕДЖ ЖАГУ</h2>
            <p className="text-center text-sm mb-4">ПРИКАЗ № ___ от «__» {dateStr} {year} г.</p>
            <p className="text-center text-sm mb-4">О зачислении на бюджетные места</p>
          </div>

          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="px-2 py-2 text-left">№</th>
                <th className="px-2 py-2 text-left">ФИО</th>
                <th className="px-2 py-2 text-left">Средний балл</th>
                <th className="px-2 py-2 text-left print:hidden">Специальность</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, idx) => (
                <tr key={entry.id} className="border-b">
                  <td className="px-2 py-2">{idx + 1}</td>
                  <td className="px-2 py-2">
                    {entry.applicant.lastName} {entry.applicant.firstName} {entry.applicant.middleName || ""}
                  </td>
                  <td className="px-2 py-2">{Number(entry.applicant.avgGrade).toFixed(2)}</td>
                  <td className="px-2 py-2 print:hidden text-gray-500">
                    {entry.specialty.code}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="print-only mt-6 pt-6 border-t">
            <p className="text-sm">Директор: _____________________</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 min-h-[44px]"
        >
          <Printer className="w-5 h-5" />
          Печать
        </button>
      </div>

      <style jsx global>{`
        @media print {
          .print-only {
            display: block !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
}