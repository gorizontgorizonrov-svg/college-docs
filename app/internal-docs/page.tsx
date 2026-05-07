import { getInternalDocuments } from "@/actions/internal-docs";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Search, Filter } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { InternalDocType, DocStatus } from "@prisma/client";

async function getFilters() {
  "use server";
  return {
    types: ["ORDER", "DIRECTIVE", "PROTOCOL", "ACT", "MEMO", "CONTRACT", "REPORT"] as InternalDocType[],
    statuses: ["PENDING", "VERIFIED", "REJECTED"] as DocStatus[],
  };
}

export default async function InternalDocsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const filters = await getFilters();

  const where: any = {};
  if (params.type) where.type = params.type;
  if (params.status) where.status = params.status;
  if (params.search) {
    where.title = { contains: params.search, mode: "insensitive" };
  }

  const documents = await prisma.internalDocument.findMany({
    where,
    include: {
      author: { include: { moderator: true } },
      approvals: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const statusLabels: Record<DocStatus, string> = {
    PENDING: "На рассмотрении",
    VERIFIED: "Утвержден",
    REJECTED: "Отклонен",
  };

  const typeLabels: Record<InternalDocType, string> = {
    ORDER: "Приказ",
    DIRECTIVE: "Распоряжение",
    PROTOCOL: "Протокол",
    ACT: "Акт",
    MEMO: "Служебная записка",
    CONTRACT: "Договор",
    REPORT: "Отчет",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Внутренние документы</h1>
          <Link
            href="/internal-docs/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Создать</span>
          </Link>
        </div>

        <form className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="search"
                defaultValue={params.search || ""}
                placeholder="Поиск по названию..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
            </div>
            <select
              name="type"
              defaultValue={params.type || ""}
              className="md:col-span-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="">Все типы</option>
              {filters.types.map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t]}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={params.status || ""}
              className="md:col-span-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="">Все статусы</option>
              {filters.statuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="md:col-span-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors min-h-[44px]"
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Название</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Тип</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Статус</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Автор</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Документов не найдено
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/internal-docs/${doc.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {doc.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {typeLabels[doc.type]}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            doc.status === "VERIFIED"
                              ? "bg-green-100 text-green-700"
                              : doc.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {statusLabels[doc.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {doc.author.moderator
                          ? `${doc.author.moderator.firstName} ${doc.author.moderator.lastName}`
                          : doc.author.email || doc.author.phone}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(doc.createdAt).toLocaleDateString("ru-RU")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2 p-4">
            {documents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Документов не найдено</p>
            ) : (
              documents.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/internal-docs/${doc.id}`}
                  className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                      <p className="text-sm text-gray-500">{typeLabels[doc.type]}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                            doc.status === "VERIFIED"
                              ? "bg-green-100 text-green-700"
                              : doc.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {statusLabels[doc.status]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(doc.createdAt).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}