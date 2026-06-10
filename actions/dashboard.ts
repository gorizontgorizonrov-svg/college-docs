"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getDashboardStats(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const [
    totalDocuments,
    draftDocuments,
    inApproval,
    approved,
    pendingApprovals,
    unreadNotifications,
  ] = await Promise.all([
    prisma.internalDocument.count({ where: { authorId: userId } }),
    prisma.internalDocument.count({ where: { authorId: userId, status: "DRAFT" } }),
    prisma.internalDocument.count({ where: { authorId: userId, status: "IN_APPROVAL" } }),
    prisma.internalDocument.count({ where: { authorId: userId, status: "APPROVED" } }),
    prisma.documentApproval.count({
      where: { approverId: userId, decision: null, document: { status: "IN_APPROVAL" } },
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    totalDocuments,
    draftDocuments,
    inApproval,
    approved,
    pendingApprovals,
    unreadNotifications,
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
