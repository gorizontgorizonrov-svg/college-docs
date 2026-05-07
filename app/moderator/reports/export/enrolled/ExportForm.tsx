"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

const exportSchema = z.object({
  specialtyId: z.string().optional(),
});

type ExportFormData = z.infer<typeof exportSchema>;

interface Specialty {
  id: string;
  code: string;
  name: string;
}

function EnrolledExportForm({ specialties }: { specialties: Specialty[] }) {
  const [exporting, setExporting] = useState(false);
  const { register, handleSubmit } = useForm<ExportFormData>();

  const onSubmit = async (data: ExportFormData) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (data.specialtyId) params.set("specialtyId", data.specialtyId);

      const response = await fetch(`/api/reports/export/enrolled?${params}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enrolled_${new Date().toISOString().split("T")[0]}.xlsx`;
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
          <h1 className="text-xl font-bold">Экспорт зачисленных</h1>
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

          <button type="submit" disabled={exporting} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[44px] disabled:opacity-50">
            <Download className="w-5 h-5" />
            {exporting ? "Экспорт..." : "Скачать Excel"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EnrolledExportForm;