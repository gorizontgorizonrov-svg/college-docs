import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getApplicationsReport } from "@/actions/reports";
import * as XLSX from "xlsx";
import type { Application, Applicant, Specialty, User, AppStatus } from "@prisma/client";

type ApplicationWithRelations = Application & {
  applicant: Applicant & { user: User };
  specialty: Specialty;
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as AppStatus | undefined;
    const filters = {
      specialtyId: searchParams.get("specialtyId") || undefined,
      status: statusParam,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    const applications = await getApplicationsReport(filters) as ApplicationWithRelations[];

    const data = applications.map((app: ApplicationWithRelations) => ({
      "Фамилия": app.applicant.lastName,
      "Имя": app.applicant.firstName,
      "Отчество": app.applicant.middleName || "",
      "Специальность": `${app.specialty.code} - ${app.specialty.name}`,
      "Приоритет": app.priority,
      "Статус": app.status === "SUBMITTED" ? "Подано" : 
                app.status === "UNDER_REVIEW" ? "На проверке" :
                app.status === "APPROVED" ? "Одобрено" :
                app.status === "REJECTED" ? "Отклонено" :
                app.status === "ENROLLED" ? "Зачислен" : app.status,
      "Средний балл": Number(app.applicant.avgGrade),
      "Телефон": app.applicant.phoneNumber,
      "Дата подачи": new Date(app.submittedAt).toLocaleDateString("ru-RU"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Заявления");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    try {
      const { createAuditLog } = await import("@/actions/audit");
      await createAuditLog({
        moderatorId: session.user.id,
        action: "EXPORT",
        entityType: "Report",
        entityId: "applications",
        comment: `Экспорт: specialty=${filters.specialtyId || 'all'}, status=${filters.status || 'all'}`,
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="applications_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Ошибка при экспорте" }, { status: 500 });
  }
}