"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import type { AppStatus, Prisma, Specialty, Application } from "@prisma/client";

export type SpecialtyWithApps = Specialty & { applications: Application[] };

export async function getApplicationsReport(filters?: {
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
      applicant: { include: { user: true } },
      specialty: true,
    },
    orderBy: { submittedAt: "desc" },
  });
}

export async function getEnrollmentRanking(specialtyId?: string) {
  const where: Prisma.ApplicationWhereInput = {
    status: { in: ["APPROVED", "ENROLLED"] },
  };

  if (specialtyId) {
    where.specialtyId = specialtyId;
  }

  const applications = await prisma.application.findMany({
    where,
    include: {
      applicant: true,
      specialty: true,
    },
    orderBy: {
      applicant: {
        avgGrade: "desc",
      },
    },
  });

  return applications.map((app, index) => ({
    ...app,
    rank: index + 1,
  }));
}

export async function getEnrollmentStats() {
  const [total, statusCounts, specialtyStatsRaw, avgGradeStats] = await Promise.all([
    prisma.application.count(),
    prisma.application.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.specialty.findMany({
      include: {
        applications: true,
      },
    }),
    prisma.applicant.aggregate({
      _avg: { avgGrade: true },
    }),
  ]);

  const byStatus: Record<string, number> = {};
  statusCounts.forEach((s) => {
    byStatus[s.status] = s._count;
  });

  const specialtyStats = specialtyStatsRaw.map((spec: SpecialtyWithApps) => {
    const submitted = spec.applications.length;
    const approved = spec.applications.filter((a: Application) => a.status === "APPROVED").length;
    const enrolled = spec.applications.filter((a: Application) => a.status === "ENROLLED").length;
    const budgetPlaces = spec.budgetPlaces || 0;
    const contractPlaces = spec.contractPlaces || 0;
    const totalPlaces = budgetPlaces + contractPlaces;
    const fillPercent = budgetPlaces > 0 ? Math.round((enrolled / budgetPlaces) * 100) : 0;
    const competition = totalPlaces > 0 ? (submitted / totalPlaces).toFixed(1) : "0";

    return {
      id: spec.id,
      code: spec.code,
      name: spec.name,
      budgetPlaces,
      contractPlaces,
      submitted,
      approved,
      enrolled,
      competition,
      fillPercent,
    };
  });

  return {
    total,
    byStatus,
    specialtyStats,
    avgGrade: avgGradeStats._avg.avgGrade?.toFixed(2) || "0",
  };
}

export async function runEnrollmentAlgorithm() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Не авторизован");
  }

  const moderatorId = session.user.id;
  const specialties = await prisma.specialty.findMany();

  let enrolledCount = 0;

  for (const specialty of specialties) {
    const applications = await prisma.application.findMany({
      where: {
        specialtyId: specialty.id,
        status: "APPROVED",
      },
      include: {
        applicant: true,
      },
      orderBy: {
        applicant: {
          avgGrade: "desc",
        },
      },
    });

    const budgetCount = specialty.budgetPlaces;
    let enrolled = 0;

    for (const app of applications) {
      if (enrolled < budgetCount) {
        await prisma.application.update({
          where: { id: app.id },
          data: { status: "ENROLLED", enrolledAt: new Date() },
        });
        
        await prisma.auditLog.create({
          data: {
            moderatorId,
            action: "ENROLL",
            entityType: "Application",
            entityId: app.id,
            oldStatus: "APPROVED",
            newStatus: "ENROLLED",
            comment: `Зачислен на специальность ${specialty.code}`,
          },
        });
        
        enrolled++;
        enrolledCount++;
      } else {
        break;
      }
    }
  }

  revalidatePath("/moderator/reports");
  revalidatePath("/moderator/applications");

  return { enrolledCount };
}

export async function getEnrolledStudents(specialtyId?: string) {
  const where: Prisma.ApplicationWhereInput = {
    status: "ENROLLED",
  };

  if (specialtyId) {
    where.specialtyId = specialtyId;
  }

  return prisma.application.findMany({
    where,
    include: {
      applicant: { include: { user: true } },
      specialty: true,
    },
    orderBy: {
      applicant: { avgGrade: "desc" },
    },
  });
}