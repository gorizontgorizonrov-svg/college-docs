"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getProfile(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      employee: { include: { position: true, department: true } },
    },
  });
  if (!user) throw new Error("Пользователь не найден");

  const docStats = await Promise.all([
    prisma.internalDocument.count({ where: { authorId: userId } }),
    prisma.internalDocument.count({ where: { authorId: userId, status: "DRAFT" } }),
    prisma.internalDocument.count({ where: { authorId: userId, status: "IN_APPROVAL" } }),
    prisma.internalDocument.count({ where: { authorId: userId, status: "APPROVED" } }),
    prisma.documentApproval.count({ where: { approverId: userId, decision: null } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
    employee: user.employee ? {
      firstName: user.employee.firstName,
      lastName: user.employee.lastName,
      middleName: user.employee.middleName,
      position: user.employee.position?.name || null,
      department: user.employee.department?.name || null,
    } : null,
    stats: {
      totalDocuments: docStats[0],
      draftDocuments: docStats[1],
      inApproval: docStats[2],
      approved: docStats[3],
      pendingApprovals: docStats[4],
      unreadNotifications: docStats[5],
    },
  };
}

export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  middleName?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
  });
  if (!employee) throw new Error("Сотрудник не найден");

  await prisma.employee.update({
    where: { userId: session.user.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
    },
  });

  return { success: true };
}
