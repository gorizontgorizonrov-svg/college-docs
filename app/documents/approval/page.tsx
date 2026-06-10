import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPendingApprovals } from "@/actions/documents";
import Link from "next/link";

export default async function ApprovalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const pending = await getPendingApprovals(session.user.id);
  const signable = pending.filter((a) => a.document.status === "APPROVED" && !a.decision);

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">На подпись</h1>
        {signable.length === 0 ? (
          <p className="text-[var(--text-muted)]">Нет документов на подпись</p>
        ) : (
          signable.map((a) => (
            <Link key={a.id} href={`/documents/${a.document.id}`} className="card p-4 block">
              <p className="font-medium text-[var(--text-primary)]">{a.document.title}</p>
              <p className="text-sm text-[var(--text-muted)]">{new Date(a.document.createdAt).toLocaleDateString("ru-RU")}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
