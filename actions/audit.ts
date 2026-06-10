"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";
import type { AuditAction } from "@prisma/client";

export async function createAuditLog(data: {
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldStatus?: string;
  newStatus?: string;
  comment?: string;
  signatureId?: string;
}) {
  const session = await auth();
  if (!session?.user) return;

  const headersList = await headers();

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus,
      comment: data.comment,
      signatureId: data.signatureId,
      ipAddress: headersList.get("x-forwarded-for") || headersList.get("x-real-ip"),
      userAgent: headersList.get("user-agent"),
    },
  });
}

export async function getAuditLogs(filters?: {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  return (prisma.auditLog.findMany as any)({
    where: {
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(filters?.action ? { action: filters.action } : {}),
      ...(filters?.entityType ? { entityType: filters.entityType } : {}),
    },
    include: { user: { include: { employee: true } } },
    orderBy: { createdAt: "desc" },
    take: filters?.limit || 100,
  });
}
