"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

const exportSchema = z.object({
  specialtyId: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

type ExportFormData = z.infer<typeof exportSchema>;

interface Specialty {
  id: string;
  code: string;
  name: string;
}

export default function ExportForm({ specialties }: { specialties: Specialty[] }) {
  const [exporting, setExporting] = useState(false);
  const { register, handleSubmit } = useForm<ExportFormData>();

  const onSubmit = async (data: ExportFormData) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (data.specialtyId) params.set("specialtyId", data.specialtyId);
      if (data.status) params.set("status", data.status);
      if (data.dateFrom) params.set("dateFrom", data.dateFrom);
      if (data.dateTo) params.set("dateTo", data.dateTo);

      const response = await fetch(`/api/reports/export/applications?${params}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `applications_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/moderator/reports" className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border hover:bg-gray-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Экспорт</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Специальность</label>
            <select {...register("specialtyId")} className="w-full px-4 py-3 border rounded-lg min-h-[44px]">
              <option value="">Все</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Статус</label>
            <select {...register("status")} className="w-full px-4 py-3 border rounded-lg min-h-[44px]">
              <option value="">Все</option>
              <option value="SUBMITTED">Подано</option>
              <option value="APPROVED">Одобрено</option>
              <option value="REJECTED">Отклонено</option>
              <option value="ENROLLED">Зачислен</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Дата от</label>
              <input {...register("dateFrom")} type="date" className="w-full px-4 py-3 border rounded-lg min-h-[44px]" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Дата до</label>
              <input {...register("dateTo")} type="date" className="w-full px-4 py-3 border rounded-lg min-h-[44px]" />
            </div>
          </div>

          <button type="submit" disabled={exporting} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[44px] disabled:opacity-50">
            <Download className="w-5 h-5" />
            {exporting ? "Экспорт..." : "Скачать Excel"}
          </button>
        </form>
      </div>
    </div>
  );
}