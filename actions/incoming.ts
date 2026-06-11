"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";
import type { IncomingStatus, Prisma } from "@prisma/client";

export async function registerIncoming(data: {
  incomingNumber: string;
  incomingDate: string;
  fromOrg: string;
  outgoingNumber?: string;
  outgoingDate?: string;
  title: string;
  content?: string;
  fileUrl?: string;
  fileInfo?: {
    originalName: string;
    storedName: string;
    mimeType: string;
    fileSize: number;
  };
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const doc = await prisma.$transaction(async (tx) => {
    const d = await tx.incomingDocument.create({
      data: {
        incomingNumber: data.incomingNumber,
        incomingDate: new Date(data.incomingDate),
        fromOrg: data.fromOrg,
        outgoingNumber: data.outgoingNumber,
        outgoingDate: data.outgoingDate ? new Date(data.outgoingDate) : null,
        title: data.title,
        content: data.content,
        fileUrl: data.fileUrl,
        createdById: session.user.id,
      },
    });

    if (data.fileInfo && data.fileUrl) {
      await tx.fileAttachment.create({
        data: {
          incomingId: d.id,
          originalName: data.fileInfo.originalName,
          storedName: data.fileInfo.storedName,
          mimeType: data.fileInfo.mimeType,
          fileSize: data.fileInfo.fileSize,
          uploadedById: session.user.id,
          fileUrl: data.fileUrl,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "REGISTER",
        entityType: "IncomingDocument",
        entityId: d.id,
      },
    });

    return d;
  });

  revalidatePath("/incoming");
  return doc;
}

export async function setResolution(
  id: string,
  resolutionText: string,
  executorId: string,
  deadline: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  await prisma.$transaction(async (tx) => {
    const doc = await tx.incomingDocument.update({
      where: { id },
      data: {
        resolution: resolutionText,
        resolutionAuthorId: session.user.id,
        resolutionDate: new Date(),
        executorId,
        deadline: new Date(deadline),
        status: "UNDER_RESOLUTION",
      },
    });

    await createNotification(
      executorId,
      "RESOLUTION_ASSIGNED",
      "Назначена резолюция",
      `Вам назначена резолюция по входящему документу "${doc.title}". Срок: ${new Date(deadline).toLocaleDateString("ru-RU")}`,
      "IncomingDocument",
      id
    );

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ASSIGN_RESOLUTION",
        entityType: "IncomingDocument",
        entityId: id,
      },
    });
  });

  revalidatePath("/incoming");
}

export async function getIncomingList(filters?: {
  status?: IncomingStatus;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const where: Prisma.IncomingDocumentWhereInput = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { incomingNumber: { contains: filters.search, mode: "insensitive" } },
      { fromOrg: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.incomingDocument.findMany({
    where,
    include: {
      resolutionAuthor: { include: { employee: true } },
      executor: { include: { position: true } },
      _count: { select: { fileAttachments: true } },
    },
    orderBy: { incomingDate: "desc" },
  });
}

export async function getIncomingById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  return prisma.incomingDocument.findUnique({
    where: { id },
    include: {
      resolutionAuthor: { include: { employee: { include: { position: true } } } },
      executor: { include: { position: true, department: true, user: true } },
      createdBy: { include: { employee: true } },
      responseDocument: true,
    },
  });
}

export async function sendToArchive(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  await prisma.$transaction(async (tx) => {
    await tx.incomingDocument.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ARCHIVE",
        entityType: "IncomingDocument",
        entityId: id,
      },
    });
  });

  revalidatePath("/incoming");
}

export async function markExecuted(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const doc = await prisma.$transaction(async (tx) => {
    const d = await tx.incomingDocument.update({
      where: { id },
      data: { status: "EXECUTED", executedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ARCHIVE",
        entityType: "IncomingDocument",
        entityId: id,
      },
    });

    return d;
  });

  revalidatePath("/incoming");
  return doc;
}
