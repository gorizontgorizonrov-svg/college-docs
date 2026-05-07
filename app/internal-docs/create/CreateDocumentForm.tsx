"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Save } from "lucide-react";
import { createInternalDocument } from "@/actions/internal-docs";
import type { User } from "@prisma/client";

const documentSchema = z.object({
  title: z.string().min(1, "Введите название документа"),
  content: z.string().optional(),
  type: z.enum(["ORDER", "DIRECTIVE", "PROTOCOL", "ACT", "MEMO", "CONTRACT", "REPORT"]),
  approverIds: z.array(z.string()).min(1, "Выберите хотя бы одного согласующего"),
});

type DocumentForm = z.infer<typeof documentSchema>;

const docTypeLabels: Record<string, string> = {
  ORDER: "Приказ",
  DIRECTIVE: "Распоряжение",
  PROTOCOL: "Протокол",
  ACT: "Акт",
  MEMO: "Служебная записка",
  CONTRACT: "Договор",
  REPORT: "Отчет",
};

interface Approver extends User {
  moderator: {
    firstName: string;
    lastName: string;
    position: string | null;
  } | null;
}

interface CreateDocumentFormProps {
  approvers: Approver[];
}

export function CreateDocumentForm({ approvers }: CreateDocumentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentForm>({
    resolver: zodResolver(documentSchema),
  });

  const onSubmit = async (data: DocumentForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await createInternalDocument({
        title: data.title,
        content: data.content,
        type: data.type,
        approverIds: data.approverIds,
      });
      router.push("/internal-docs");
    } catch (err) {
      setError("Ошибка при создании документа");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Название документа *</label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            {...register("title")}
            placeholder="Введите название документа"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
          />
        </div>
        {errors.title && (
          <p className="text-red-500 text-sm">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Тип документа *</label>
        <select
          {...register("type")}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        >
          <option value="">Выберите тип документа</option>
          {Object.entries(docTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.type && (
          <p className="text-red-500 text-sm">{errors.type.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Текст документа</label>
        <textarea
          {...register("content")}
          rows={6}
          placeholder="Введите текст документа..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Согласующие *</label>
        <p className="text-xs text-gray-500 mb-2">Выберите сотрудников для согласования</p>
        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
          {approvers.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Нет доступных согласующих</p>
          ) : (
            approvers.map((approver) => (
              <label
                key={approver.id}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={approver.id}
                  {...register("approverIds")}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {approver.moderator
                    ? `${approver.moderator.firstName} ${approver.moderator.lastName}`
                    : approver.email || approver.phone}
                  {approver.moderator?.position && (
                    <span className="text-gray-400 text-xs ml-2">
                      ({approver.moderator.position})
                    </span>
                  )}
                </span>
              </label>
            ))
          )}
        </div>
        {errors.approverIds && (
          <p className="text-red-500 text-sm">{errors.approverIds.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span>Создание...</span>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Создать документ
          </>
        )}
      </button>
    </form>
  );
}