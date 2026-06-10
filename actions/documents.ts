"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { InternalDocType, DocumentStatus } from "@prisma/client";
import { createNotification } from "./notifications";

export async function createDocument(data: {
  title: string;
  content?: string;
  type: InternalDocType;
  fileUrl?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const template = await prisma.workflowTemplate.findFirst({
    where: { docType: data.type },
    include: { stages: { orderBy: { stageOrder: "asc" } } },
  });

  const doc = await prisma.internalDocument.create({
    data: {
      title: data.title,
      content: data.content,
      type: data.type,
      status: "DRAFT",
      fileUrl: data.fileUrl,
      authorId: session.user.id,
      workflowId: template?.id,
    },
  });

  if (template) {
    for (const stage of template.stages) {
      const approvers = await prisma.employee.findMany({
        where: { positionId: stage.approverPositionId },
        include: { user: true },
      });
      for (const emp of approvers) {
        await prisma.documentApproval.create({
          data: {
            documentId: doc.id,
            stageId: stage.id,
            approverId: emp.user.id,
          },
        });
      }
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "InternalDocument",
      entityId: doc.id,
    },
  });

  revalidatePath("/documents");
  return doc;
}

export async function getDocumentById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  return prisma.internalDocument.findUnique({
    where: { id },
    include: {
      author: { include: { employee: { include: { position: true, department: true } } } },
      approvals: {
        include: {
          approver: { include: { employee: { include: { position: true } } } },
          stage: true,
          signature: { include: { employee: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      versions: { orderBy: { version: "desc" } },
      signatures: { include: { employee: true } },
      workflow: { include: { stages: { orderBy: { stageOrder: "asc" } } } },
    },
  });
}

export async function getMyDocuments(
  userId: string,
  filters?: { status?: DocumentStatus; type?: InternalDocType }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const where: any = { authorId: userId };
  if (filters?.status) where.status = filters.status;
  if (filters?.type) where.type = filters.type;

  return prisma.internalDocument.findMany({
    where,
    include: {
      author: { include: { employee: true } },
      approvals: {
        include: { approver: { include: { employee: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingApprovals(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  return prisma.documentApproval.findMany({
    where: {
      approverId: userId,
      decision: null,
      document: { status: "IN_APPROVAL" },
    },
    include: {
      document: {
        include: {
          author: { include: { employee: { include: { position: true } } } },
        },
      },
      stage: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateDocument(
  id: string,
  data: { title?: string; content?: string; fileUrl?: string; changeNote?: string }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const doc = await prisma.internalDocument.findUnique({ where: { id } });
  if (!doc) throw new Error("Документ не найден");
  if (doc.status !== "DRAFT") throw new Error("Редактировать можно только черновик");
  if (doc.authorId !== session.user.id) throw new Error("Нет доступа");

  const currentVersion = await prisma.documentVersion.count({ where: { documentId: id } });

  await prisma.documentVersion.create({
    data: {
      documentId: id,
      version: currentVersion + 1,
      content: doc.content,
      fileUrl: doc.fileUrl,
      changeNote: data.changeNote || `Редактирование #${currentVersion + 1}`,
      authorId: session.user.id,
    },
  });

  const updated = await prisma.internalDocument.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      fileUrl: data.fileUrl,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "EDIT",
      entityType: "InternalDocument",
      entityId: id,
    },
  });

  revalidatePath(`/documents/${id}`);
  return updated;
}

export async function deleteDocument(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const doc = await prisma.internalDocument.findUnique({ where: { id } });
  if (!doc) throw new Error("Документ не найден");
  if (doc.status !== "DRAFT") throw new Error("Удалить можно только черновик");
  if (doc.authorId !== session.user.id) throw new Error("Нет доступа");

  await prisma.internalDocument.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entityType: "InternalDocument",
      entityId: id,
    },
  });

  revalidatePath("/documents");
}

export async function sendToWorkflow(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const doc = await prisma.internalDocument.findUnique({
    where: { id },
    include: {
      approvals: {
        where: { stage: { stageOrder: 1 } },
        include: { approver: true },
      },
    },
  });
  if (!doc) throw new Error("Документ не найден");
  if (doc.status !== "DRAFT") throw new Error("Документ уже отправлен");

  const number = `${doc.type}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;

  await prisma.internalDocument.update({
    where: { id },
    data: { status: "IN_APPROVAL", number },
  });

  for (const approval of doc.approvals) {
    await createNotification(
      approval.approverId,
      "APPROVAL_REQUEST",
      "Новый документ на согласование",
      `Документ "${doc.title}" ожидает вашего согласования.`,
      "InternalDocument",
      id
    );
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "APPROVE",
      entityType: "InternalDocument",
      entityId: id,
      newStatus: "IN_APPROVAL",
    },
  });

  revalidatePath(`/documents/${id}`);
  return { number };
}

export async function addVersion(
  id: string,
  data: { content?: string; fileUrl?: string; changeNote: string }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const currentVersion = await prisma.documentVersion.count({ where: { documentId: id } });

  return prisma.documentVersion.create({
    data: {
      documentId: id,
      version: currentVersion + 1,
      content: data.content,
      fileUrl: data.fileUrl,
      changeNote: data.changeNote,
      authorId: session.user.id,
    },
  });
}
