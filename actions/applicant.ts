"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { DocType, AppStatus } from "@prisma/client";

export async function getApplicantDocuments(applicantUserId: string) {
  const applicant = await prisma.applicant.findUnique({
    where: { userId: applicantUserId },
  });

  if (!applicant) return [];

  return prisma.document.findMany({
    where: { applicantId: applicant.id },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function createDocument(data: {
  applicantId: string;
  type: DocType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Не авторизован");
  }

  const document = await prisma.document.create({
    data: {
      applicantId: data.applicantId,
      type: data.type,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      status: "PENDING",
    },
  });

  revalidatePath("/documents");
  return document;
}

export async function deleteDocument(documentId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Не авторизован");
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error("Документ не найден");
  }

  const applicant = await prisma.applicant.findUnique({
    where: { userId: session.user.id },
  });

  if (!applicant || document.applicantId !== applicant.id) {
    throw new Error("Нет доступа");
  }

  await prisma.document.delete({
    where: { id: documentId },
  });

  revalidatePath("/documents");
}

export async function getSpecialties() {
  return prisma.specialty.findMany({
    where: {
      OR: [
        { budgetPlaces: { gt: 0 } },
        { contractPlaces: { gt: 0 } },
      ],
    },
    orderBy: { code: "asc" },
  });
}

export async function getApplicantApplications(applicantUserId: string) {
  const applicant = await prisma.applicant.findUnique({
    where: { userId: applicantUserId },
  });

  if (!applicant) return [];

  return prisma.application.findMany({
    where: { applicantId: applicant.id },
    include: {
      specialty: true,
      reviews: {
        include: {
          moderator: true,
        },
      },
    },
    orderBy: { priority: "asc" },
  });
}

export async function submitApplication(data: {
  applicantId: string;
  specialtyIds: string[];
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Не авторизован");
  }

  if (data.specialtyIds.length === 0) {
    throw new Error("Выберите хотя бы одну специальность");
  }

  if (data.specialtyIds.length > 3) {
    throw new Error("Макмум 3 специальности");
  }

  await prisma.application.deleteMany({
    where: { applicantId: data.applicantId },
  });

  const applications = await Promise.all(
    data.specialtyIds.map((specialtyId, index) =>
      prisma.application.create({
        data: {
          applicantId: data.applicantId,
          specialtyId,
          priority: index + 1,
          status: "SUBMITTED",
        },
      })
    )
  );

  revalidatePath("/applicant/applications");
  revalidatePath("/applicant/status");
  return applications;
}

export async function getApplicationStatus(applicantUserId: string) {
  const applicant = await prisma.applicant.findUnique({
    where: { userId: applicantUserId },
  });

  if (!applicant) return null;

  const applications = await prisma.application.findMany({
    where: { applicantId: applicant.id },
    include: {
      specialty: true,
      reviews: {
        include: {
          moderator: true,
        },
      },
    },
    orderBy: { priority: "asc" },
  });

  const documents = await prisma.document.findMany({
    where: { applicantId: applicant.id },
  });

  const allDocsVerified =
    documents.length > 0 &&
    documents.every((doc) => doc.status === "VERIFIED");
  const allAppsApproved = applications.every(
    (app) => app.status === "APPROVED" || app.status === "ENROLLED"
  );

  let overallStatus: AppStatus = "SUBMITTED";
  if (allDocsVerified && allAppsApproved) {
    overallStatus = "ENROLLED";
  } else if (applications.some((app) => app.status === "UNDER_REVIEW")) {
    overallStatus = "UNDER_REVIEW";
  } else if (applications.every((app) => app.status === "APPROVED")) {
    overallStatus = "APPROVED";
  } else if (applications.some((app) => app.status === "REJECTED")) {
    overallStatus = "REJECTED";
  }

  return {
    applicant,
    applications,
    documents,
    overallStatus,
  };
}