import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { firstName, lastName, middleName, positionId, departmentId, role, isActive, newPassword } = await req.json();

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ error: "Сотрудник не найден" }, { status: 404 });
    }

    await prisma.employee.update({
      where: { id },
      data: { firstName, lastName, middleName, positionId, departmentId: departmentId || null },
    });

    const updateData: any = { role, isActive };
    if (newPassword) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({
      where: { id: employee.userId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EDIT",
        entityType: "User",
        entityId: employee.userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json({ error: "Ошибка при обновлении" }, { status: 500 });
  }
}
