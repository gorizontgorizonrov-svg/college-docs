"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import bcrypt from "bcryptjs";

export async function getProfile(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      employee: {
        include: {
          position: true,
          department: true,
        },
      },
    },
  });

  return user;
}

export async function updateProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    email?: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");
  if (session.user.id !== userId) throw new Error("Нет доступа");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });
  if (!user) throw new Error("Пользователь не найден");

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("Email уже используется");
  }

  await prisma.$transaction(async (tx) => {
    if (data.email) {
      await tx.user.update({
        where: { id: userId },
        data: { email: data.email },
      });
    }

    if (user.employee) {
      await tx.employee.update({
        where: { id: user.employee.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EDIT",
        entityType: "User",
        entityId: userId,
        comment: "Обновление профиля",
      },
    });
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const file = formData.get("avatar") as File | null;
  if (!file) throw new Error("Файл не выбран");

  if (!file.type.startsWith("image/")) throw new Error("Только изображения");
  if (file.size > 5 * 1024 * 1024) throw new Error("Максимум 5 МБ");

  const uploadDir = join(process.cwd(), "private", "uploads", "avatars");
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const ext = file.name.split(".").pop() || "png";
  const fileName = `avatar-${session.user.id}-${Date.now()}.${ext}`;
  const filePath = join(uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const avatarUrl = `/api/files/avatars/${fileName}`;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { employee: true },
  });

  if (user?.employee) {
    await prisma.employee.update({
      where: { id: user.employee.id },
      data: { avatarUrl },
    });
  }

  revalidatePath("/profile");
  return { avatarUrl };
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");
  if (session.user.id !== userId) throw new Error("Нет доступа");

  if (newPassword.length < 6) throw new Error("Новый пароль минимум 6 символов");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Пользователь не найден");

  const isValid = await bcrypt.compare(oldPassword, user.passwordHash || "");
  if (!isValid) throw new Error("Неверный текущий пароль");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "EDIT",
      entityType: "User",
      entityId: userId,
      comment: "Смена пароля",
    },
  });

  return { success: true };
}
