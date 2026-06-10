"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { NotificationType } from "@prisma/client";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message?: string,
  entityType?: string,
  entityId?: string
) {
  return prisma.notification.create({
    data: { userId, type, title, message, entityType, entityId },
  });
}

export async function getMyNotifications(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function getUnreadCount(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markAllAsRead(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
