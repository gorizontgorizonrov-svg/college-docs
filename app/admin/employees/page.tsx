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
    <div className="anim-fade-in space-y-4">
      <h1 className="doc-h1">Управление сотрудниками</h1>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Email</th>
              <th>Должность</th>
              <th>Отдел</th>
              <th>Роль</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {emp.lastName} {emp.firstName} {emp.middleName || ""}
                </td>
                <td>{emp.user.email}</td>
                <td>{emp.position.name}</td>
                <td style={{ color: "var(--text-muted)" }}>{emp.department?.name || "—"}</td>
                <td>
                  <span className="badge badge-info">{roleLabels[emp.user.role] || emp.user.role}</span>
                </td>
                <td>
                  <span className={`badge ${emp.user.isActive ? "badge-success" : "badge-danger"}`}>
                    {emp.user.isActive ? "Активен" : "Заблокирован"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
