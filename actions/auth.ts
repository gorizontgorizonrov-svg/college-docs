"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";

export async function registerUser(data: {
  email?: string;
  phone: string;
  password: string;
  role?: Role;
}) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: data.email },
        { phone: data.phone },
      ],
    },
  });

  if (existingUser) {
    throw new Error("Пользователь с таким email или телефоном уже существует");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role || "APPLICANT",
    },
  });

  return { id: user.id, email: user.email, phone: user.phone };
}

export async function createApplicantProfile(data: {
  userId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: Date;
  schoolCertType: "GRADE_9" | "GRADE_11";
  avgGrade: number;
  phoneNumber: string;
}) {
  const existingApplicant = await prisma.applicant.findUnique({
    where: { userId: data.userId },
  });

  if (existingApplicant) {
    throw new Error("Профиль абитуриента уже существует");
  }

  const applicant = await prisma.applicant.create({
    data: {
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      birthDate: data.birthDate,
      schoolCertType: data.schoolCertType,
      avgGrade: data.avgGrade,
      phoneNumber: data.phoneNumber,
    },
  });

  return applicant;
}

export async function updateApplicantProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    birthDate?: Date;
    schoolCertType?: "GRADE_9" | "GRADE_11";
    avgGrade?: number;
    phoneNumber?: string;
  }
) {
  const applicant = await prisma.applicant.findUnique({
    where: { userId },
  });

  if (!applicant) {
    throw new Error("Профиль абитуриента не найден");
  }

  return prisma.applicant.update({
    where: { userId },
    data,
  });
}

export async function getApplicantProfile(userId: string) {
  return prisma.applicant.findUnique({
    where: { userId },
    include: {
      documents: true,
      applications: {
        include: { specialty: true, reviews: true },
        orderBy: { priority: "asc" },
      },
    },
  });
}

export async function getModeratorProfile(userId: string) {
  return prisma.moderator.findUnique({
    where: { userId },
    include: {
      user: true,
      reviews: {
        include: {
          application: {
            include: {
              applicant: true,
              specialty: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}