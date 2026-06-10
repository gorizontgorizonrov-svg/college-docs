import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EmployeeEditForm } from "./EmployeeEditForm";

export default async function EmployeeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { user: true, position: true, department: true },
  });
  if (!employee) return <div className="p-8 text-center text-[var(--text-muted)]">Сотрудник не найден</div>;

  const positions = await prisma.position.findMany({ orderBy: { name: "asc" } });
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/employees" className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)]">
            <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            {employee.lastName} {employee.firstName}
          </h1>
        </div>

        <EmployeeEditForm
          employee={JSON.parse(JSON.stringify(employee))}
          positions={JSON.parse(JSON.stringify(positions))}
          departments={JSON.parse(JSON.stringify(departments))}
        />
      </div>
    </div>
  );
}
