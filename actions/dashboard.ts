"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getDashboardStats(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const emp = await prisma.employee.findUnique({ where: { userId } });

  const [
    totalDocuments,
    draftDocuments,
    inApproval,
    approved,
    pendingApprovals,
    unreadNotifications,
    totalAssignments,
    pendingAssignments,
    overdueAssignments,
  ] = await Promise.all([
    prisma.internalDocument.count({ where: { authorId: userId } }),
    prisma.internalDocument.count({ where: { authorId: userId, status: "DRAFT" } }),
    prisma.internalDocument.count({ where: { authorId: userId, status: "IN_APPROVAL" } }),
    prisma.internalDocument.count({ where: { authorId: userId, status: "APPROVED" } }),
    prisma.documentApproval.count({
      where: { approverId: userId, decision: null, document: { status: "IN_APPROVAL" } },
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    emp ? prisma.assignment.count({ where: { executorId: emp.id } }) : 0,
    emp ? prisma.assignment.count({ where: { executorId: emp.id, status: "PENDING" } }) : 0,
    emp ? prisma.assignment.count({
      where: {
        executorId: emp.id,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        deadline: { lt: new Date() },
      },
    }) : 0,
  ]);

  return {
    totalDocuments,
    draftDocuments,
    inApproval,
    approved,
    pendingApprovals,
    unreadNotifications,
    totalAssignments,
    pendingAssignments,
    overdueAssignments,
  };
}

export async function getActivityFeed(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}
