"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { InternalDocType, DocStatus, ReviewDecision, Prisma } from "@prisma/client";

export async function getInternalDocuments(filters?: {
  type?: InternalDocType;
  status?: DocStatus;
  authorId?: string;
  search?: string;
}) {
  const where: Prisma.InternalDocumentWhereInput = {};

  if (filters?.type) {
    where.type = filters.type;
  }
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.authorId) {
    where.authorId = filters.authorId;
  }
  if (filters?.search) {
    where.title = {
      contains: filters.search,
      mode: "insensitive",
    };
  }

  return prisma.internalDocument.findMany({
    where,
    include: {
      author: {
        include: {
          moderator: true,
        },
      },
      approvals: {
        include: {
          approver: {
            include: {
              moderator: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInternalDocumentById(id: string) {
  return prisma.internalDocument.findUnique({
    where: { id },
    include: {
      author: {
        include: {
          moderator: true,
        },
      },
      approvals: {
        include: {
          approver: {
            include: {
              moderator: true,
            },
          },
        },
      },
    },
  });
}

export async function getApprovers() {
  return prisma.user.findMany({
    where: {
      role: {
        in: ["MODERATOR", "ADMIN"],
      },
    },
    include: {
      moderator: true,
    },
  });
}

export async function createInternalDocument(data: {
  title: string;
  content?: string;
  type: InternalDocType;
  approverIds: string[];
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Не авторизован");
  }

  const document = await prisma.internalDocument.create({
    data: {
      title: data.title,
      content: data.content,
      type: data.type,
      authorId: session.user.id,
      status: "PENDING",
    },
  });

  if (data.approverIds.length > 0) {
    await prisma.documentApproval.createMany({
      data: data.approverIds.map((approverId) => ({
        documentId: document.id,
        approverId,
      })),
    });
  }

  revalidatePath("/internal-docs");
  return document;
}

export async function getPendingApprovals() {
  const session = await auth();
  if (!session?.user) {
    return [];
  }

  return prisma.documentApproval.findMany({
    where: {
      approverId: session.user.id,
      decision: null,
    },
    include: {
      document: {
        include: {
          author: {
            include: {
              moderator: true,
            },
          },
        },
      },
    },
  });
}

export async function submitApproval(
  documentId: string,
  decision: ReviewDecision,
  comment?: string
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Не авторизован");
  }

  await prisma.documentApproval.updateMany({
    where: {
      documentId,
      approverId: session.user.id,
    },
    data: {
      decision,
      comment,
    },
  });

  await updateDocumentStatus(documentId);

  revalidatePath("/internal-docs");
  revalidatePath("/internal-docs/approvals");
  revalidatePath(`/internal-docs/${documentId}`);
}

async function updateDocumentStatus(documentId: string) {
  const approvals = await prisma.documentApproval.findMany({
    where: { documentId },
  });

  const hasRejected = approvals.some((a) => a.decision === "REJECT");
  const allApproved = approvals.every((a) => a.decision === "APPROVE");
  const anyReviewed = approvals.some((a) => a.decision !== null);

  let newStatus: DocStatus = "PENDING";
  if (hasRejected) {
    newStatus = "REJECTED";
  } else if (allApproved) {
    newStatus = "VERIFIED";
  } else if (anyReviewed) {
    newStatus = "PENDING";
  }

  await prisma.internalDocument.update({
    where: { id: documentId },
    data: { status: newStatus },
  });
}