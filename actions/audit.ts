"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { AuditAction } from "@prisma/client";

export async function createAuditLog(data: {
  moderatorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldStatus?: string;
  newStatus?: string;
  comment?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Не авторизован");
  }

  return prisma.auditLog.create({
    data: {
      moderatorId: data.moderatorId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus,
      comment: data.comment,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
}

export async function getAuditLogs(filters?: {
  moderatorId?: string;
  action?: AuditAction;
  entityType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const where: any = {};

  if (filters?.moderatorId) {
    where.moderatorId = filters.moderatorId;
  }
  if (filters?.action) {
    where.action = filters.action;
  }
  if (filters?.entityType) {
    where.entityType = filters.entityType;
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters?.dateFrom) {
      where.createdAt.gte = filters.dateFrom;
    }
    if (filters?.dateTo) {
      where.createdAt.lte = filters.dateTo;
    }
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}