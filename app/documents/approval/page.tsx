import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPendingApprovals } from "@/actions/documents";
import Link from "next/link";
import { FileSignature, ArrowRight } from "lucide-react";

export default async function ApprovalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const pending = await getPendingApprovals(session.user.id);
  const signable = pending.filter((a) => !a.decision);

  return (
    <div className="anim-fade-in space-y-4">
      <h1 className="doc-h1">На подпись</h1>

      {signable.length === 0 ? (
        <div className="empty-state">
          <FileSignature size={32} style={{ color: "var(--text-muted)", marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
          <p>Нет документов на подпись</p>
        </div>
      ) : (
        <div className="anim-stagger" style={{ display: "grid", gap: 8 }}>
          {signable.map((a) => (
            <Link key={a.id} href={`/documents/${a.document.id}`} className="doc-item">
              <div className="doc-ico ic-purple"><FileSignature size={14} /></div>
              <div className="doc-info">
                <div className="doc-type">
                  {new Date(a.document.createdAt).toLocaleDateString("ru-RU")}
                </div>
                <div className="doc-name">{a.document.title}</div>
              </div>
              <ArrowRight size={14} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 4 }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
