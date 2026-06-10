import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    const { email, password, firstName, lastName, middleName, positionId, departmentId, role } = await req.json();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email уже используется" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, role, isActive: true },
    });

    await prisma.employee.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        middleName: middleName || null,
        positionId,
        departmentId: departmentId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "User",
        entityId: user.id,
      },
    });

    return NextResponse.json({ success: true, id: user.id });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Ошибка при создании" }, { status: 500 });
  }
}
