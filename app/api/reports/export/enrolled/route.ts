import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEnrolledStudents } from "@/actions/reports";
import * as XLSX from "xlsx";
import type { Application, Applicant, Specialty, User } from "@prisma/client";

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
    const specialtyId = searchParams.get("specialtyId") || undefined;

    const students = await getEnrolledStudents(specialtyId) as ApplicationWithRelations[];

    const studentsBySpecialty = students.reduce((acc: Record<string, unknown[]>, app: ApplicationWithRelations) => {
      const specKey = `${app.specialty.code} - ${app.specialty.name}`;
      if (!acc[specKey]) {
        acc[specKey] = [];
      }
      acc[specKey].push({
        "Фамилия": app.applicant.lastName,
        "Имя": app.applicant.firstName,
        "Отчество": app.applicant.middleName || "",
        "Телефон": app.applicant.phoneNumber,
        "Специальность": specKey,
        "Средний балл": Number(app.applicant.avgGrade),
        "Дата зачисления": app.enrolledAt ? new Date(app.enrolledAt).toLocaleDateString("ru-RU") : "",
      });
      return acc;
    }, {});

    const workbook = XLSX.utils.book_new();

    Object.entries(studentsBySpecialty).forEach(([specName, data]: [string, unknown[]]) => {
      const sheetName = specName.length > 30 ? specName.substring(0, 30) : specName;
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    try {
      const { createAuditLog } = await import("@/actions/audit");
      await createAuditLog({
        moderatorId: session.user.id,
        action: "EXPORT",
        entityType: "Report",
        entityId: "enrolled",
        comment: `Экспорт зачисленных: specialty=${specialtyId || 'all'}`,
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="enrolled_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Ошибка при экспорте" }, { status: 500 });
  }
}