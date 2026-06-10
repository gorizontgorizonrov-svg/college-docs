import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";

export default async function VersionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const version = await prisma.documentVersion.findUnique({
    where: { id },
    include: {
      author: { include: { employee: true } },
      document: true,
    },
  });

  if (!version) {
    return <div className="p-8 text-center text-[var(--text-muted)]">Версия не найдена</div>;
  }

  const isAuthor = version.document.authorId === session.user.id;
  const canRestore = isAuthor && version.document.status === "DRAFT";

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6 max-w-4xl">
        <Link href={`/documents/${version.documentId}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="w-4 h-4" />
          К документу
        </Link>

        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Версия {version.version}</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {version.document.title}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm mb-6">
            <div>
              <p className="text-[var(--text-muted)]">Автор версии</p>
              <p className="font-medium text-[var(--text-primary)]">
                {version.author.employee
                  ? `${version.author.employee.lastName} ${version.author.employee.firstName}`
                  : version.author.email}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Дата</p>
              <p className="font-medium text-[var(--text-primary)]">{new Date(version.createdAt).toLocaleDateString("ru-RU")}</p>
            </div>
            {version.changeNote && (
              <div>
                <p className="text-[var(--text-muted)]">Комментарий</p>
                <p className="font-medium text-[var(--text-primary)]">{version.changeNote}</p>
              </div>
            )}
          </div>

          {version.content && (
            <div className="mt-4 p-4 rounded-xl bg-[var(--bg-secondary)]">
              <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] leading-relaxed font-sans">{version.content}</pre>
            </div>
          )}

          {canRestore && (
            <form action={async () => {
              "use server";
              const session = await auth();
              if (!session?.user) return;
              await prisma.internalDocument.update({
                where: { id: version.documentId },
                data: { content: version.content },
              });
            }}>
              <button type="submit" className="btn mt-4">
                <RotateCcw className="w-4 h-4" />
                Восстановить эту версию
              </button>
            </form>
          )}

          <div className="mt-4">
            <Link href={`/documents/${version.documentId}`} className="text-sm text-[var(--accent)] hover:underline">
              Смотреть текущую версию документа →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
