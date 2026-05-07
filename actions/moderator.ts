"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { AppStatus, DocStatus, ReviewDecision, Prisma } from "@prisma/client";

export async function getModeratorDashboard() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Не авторизован");
  }

  const [appCount, docCount, specialties] = await Promise.all([
    prisma.application.count(),
    prisma.document.count({ where: { status: "PENDING" } }),
    prisma.specialty.findMany({ select: { id: true, name: true, code: true } }),
  ]);

  const statusCounts = await prisma.application.groupBy({
    by: ["status"],
    _count: true,
  });

  const stats = {
    totalApplications: appCount,
    pendingDocuments: docCount,
    byStatus: {} as Record<string, number>,
  };

  statusCounts.forEach((s) => {
    stats.byStatus[s.status] = s._count;
  });

  const recentApplications = await prisma.application.findMany({
    take: 5,
    orderBy: { submittedAt: "desc" },
    include: {
      applicant: { include: { user: true } },
      specialty: true,
    },
  });

  return { stats, recentApplications, specialties };
}

export async function getApplicationsForModerator(filters?: {
  specialtyId?: string;
  status?: AppStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) {
  const where: Prisma.ApplicationWhereInput = {};

  if (filters?.specialtyId) {
    where.specialtyId = filters.specialtyId;
  }
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.submittedAt = {};
    if (filters?.dateFrom) {
      where.submittedAt.gte = new Date(filters.dateFrom);
    }
    if (filters?.dateTo) {
      where.submittedAt.lte = new Date(filters.dateTo);
    }
  }
  if (filters?.search) {
    where.applicant = {
      OR: [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
      ],
    };
  }

  return prisma.application.findMany({
    where,
    include: {
      applicant: { include: { user: true, documents: true } },
      specialty: true,
      reviews: { include: { moderator: true }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { submittedAt: "desc" },
  });
}

export async function getApplicationDetails(applicationId: string) {
  return prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      applicant: {
        include: {
          user: true,
          documents: true,
        },
      },
      specialty: true,
      reviews: {
        include: { moderator: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function submitModeratorReview(data: {
  applicationId: string;
  moderatorId: string;
  decision: ReviewDecision;
  comment?: string;
}) {
  let newStatus: AppStatus = "UNDER_REVIEW";
  
  if (data.decision === "APPROVE") {
    newStatus = "APPROVED";
  } else if (data.decision === "REJECT") {
    newStatus = "REJECTED";
  } else if (data.decision === "REQUEST_INFO") {
    newStatus = "UNDER_REVIEW";
  }

  const oldApp = await prisma.application.findUnique({ where: { id: data.applicationId } });
  const oldStatus = oldApp?.status || "UNKNOWN";

  const application = await prisma.application.update({
    where: { id: data.applicationId },
    data: { status: newStatus },
  });

  await prisma.review.create({
    data: {
      applicationId: data.applicationId,
      moderatorId: data.moderatorId,
      decision: data.decision,
      comment: data.comment,
    },
  });

  try {
    const { createAuditLog } = await import("@/actions/audit");
    await createAuditLog({
      moderatorId: data.moderatorId,
      action: data.decision === "APPROVE" ? "APPROVE" : data.decision === "REJECT" ? "REJECT" : "REQUEST_INFO",
      entityType: "Application",
      entityId: data.applicationId,
      oldStatus,
      newStatus,
      comment: data.comment,
    });
  } catch (e) {
    console.error("Audit log error:", e);
  }

  revalidatePath("/moderator/applications");
  revalidatePath(`/moderator/applications/${data.applicationId}`);

  return application;
}

export async function updateDocStatus(data: {
  documentId: string;
  status: DocStatus;
  rejectionReason?: string;
}) {
  const oldDoc = await prisma.document.findUnique({ where: { id: data.documentId } });
  const oldStatus = oldDoc?.status || "UNKNOWN";

  const doc = await prisma.document.update({
    where: { id: data.documentId },
    data: {
      status: data.status,
      rejectionReason: data.rejectionReason,
      verifiedAt: data.status !== "PENDING" ? new Date() : null,
    },
  });

  try {
    const { createAuditLog } = await import("@/actions/audit");
    const { auth } = await import("@/auth");
    const session = await auth();
    if (session?.user) {
      await createAuditLog({
        moderatorId: session.user.id,
        action: "UPDATE_STATUS",
        entityType: "Document",
        entityId: data.documentId,
        oldStatus,
        newStatus: data.status,
        comment: data.rejectionReason,
      });
    }
  } catch (e) {
    console.error("Audit log error:", e);
  }

  revalidatePath("/documents");
  return doc;
}

export async function getAllSpecialties() {
  return prisma.specialty.findMany({
    orderBy: { code: "asc" },
  });
}