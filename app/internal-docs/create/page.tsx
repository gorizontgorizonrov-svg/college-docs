import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreateDocumentForm } from "./CreateDocumentForm";

export default async function CreateInternalDocPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const approvers = await prisma.user.findMany({
    where: {
      role: { in: ["MODERATOR", "ADMIN"] },
    },
    include: { moderator: true },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Link
            href="/internal-docs"
            className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Создание документа</h1>
        </div>

        <CreateDocumentForm approvers={approvers} />
      </div>
    </div>
  );
}