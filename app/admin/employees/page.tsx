import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const roleLabels: Record<string, string> = {
  INITIATOR: "Инициатор",
  VALIDATOR: "Согласующий",
  SIGNER: "Подписант",
  REGISTRAR: "Регистратор",
  ADMIN: "Администратор",
};

export default async function EmployeesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const employees = await prisma.employee.findMany({
    include: {
      user: true,
      position: true,
      department: true,
    },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="min-h-screen ">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Управление сотрудниками</h1>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className=" border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">ФИО</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Должность</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Отдел</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Роль</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[var(--bg-secondary)]">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                      {emp.lastName} {emp.firstName} {emp.middleName || ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{emp.user.email}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{emp.position.name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{emp.department?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="badge-info px-2 py-1 text-xs rounded-full">{roleLabels[emp.user.role] || emp.user.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${emp.user.isActive ? "badge-success" : "badge-danger"}`}>
                        {emp.user.isActive ? "Активен" : "Заблокирован"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
