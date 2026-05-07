"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { runEnrollmentAlgorithm } from "@/actions/reports";

export default function EnrollmentButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  return (
    <button
      onClick={handleEnroll}
      disabled={isPending}
      className="w-full flex items-center justify-center gap-3 p-4 bg-green-600 rounded-xl shadow-sm hover:bg-green-700 transition-colors min-h-[44px]"
    >
      <GraduationCap className="w-8 h-8 text-white" />
      <div className="text-left">
        <p className="font-medium text-white">Запуск алгоритма зачисления</p>
        <p className="text-sm text-green-100">Автоматическое распределение по бюджетным местам</p>
      </div>
    </button>
  );
}