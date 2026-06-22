"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";
import type { AssignmentStatus, Prisma } from "@prisma/client";

export async function createAssignment(data: {
  title: string;
  description?: string;
  priority: string;
  deadline?: string;
  executorId: string;
  documentId?: string;
  incomingId?: string;
  parentId?: string;
}) {
  const session = await auth();
  if (!session?.user) return { error: "Не авторизован" };

  const allowedRoles = ["SIGNER", "ADMIN"];
  if (!allowedRoles.includes(session.user.role)) return { error: "Нет прав" };

  await prisma.$transaction(async (tx) => {
    const assignment = await tx.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority as any,
        deadline: data.deadline ? new Date(data.deadline) : null,
        executorId: data.executorId,
        authorId: session.user.id,
        documentId: data.documentId,
        incomingId: data.incomingId,
        parentId: data.parentId,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ASSIGNMENT_CREATE",
        entityType: "Assignment",
        entityId: assignment.id,
      },
    });

    return assignment;
  });

  revalidatePath("/assignments");
  return { error: null, success: true };
}

export async function getAssignmentsList(filters?: {
  status?: AssignmentStatus;
  search?: string;
  role?: "executor" | "author";
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const where: Prisma.AssignmentWhereInput = {};

  if (filters?.role === "executor") {
    const emp = await prisma.employee.findUnique({ where: { userId: session.user.id } });
    if (emp) where.executorId = emp.id;
  } else if (filters?.role === "author") {
    where.authorId = session.user.id;
  } else {
    const emp = await prisma.employee.findUnique({ where: { userId: session.user.id } });
    where.OR = [
      { authorId: session.user.id },
      ...(emp ? [{ executorId: emp.id }] : []),
    ];
  }

  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.AND = [
      ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
      { title: { contains: filters.search, mode: "insensitive" as const } },
    ];
  }

  return prisma.assignment.findMany({
    where,
    include: {
      author: { include: { employee: { include: { position: true } } } },
      executor: { include: { position: true, department: true, user: true } },
      document: { select: { id: true, title: true, number: true, type: true } },
      incoming: { select: { id: true, title: true, incomingNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAssignableParents() {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  return prisma.assignment.findMany({
    where: {
      authorId: session.user.id,
      parentId: null,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: {
      executor: { include: { position: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAssignmentById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      author: { include: { employee: { include: { position: true } } } },
      executor: { include: { position: true, department: true, user: true } },
      document: { select: { id: true, title: true, number: true, type: true } },
      incoming: { select: { id: true, title: true, incomingNumber: true } },
    },
  });

  if (!assignment) return null;

  let parent = null;
  if (assignment.parentId) {
    parent = await prisma.assignment.findUnique({
      where: { id: assignment.parentId },
      select: { id: true, title: true, status: true },
    });
  }

  return { ...assignment, parent };
}

export async function getTaskChildren(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  return prisma.assignment.findMany({
    where: { parentId: id },
    include: {
      executor: { include: { position: true, user: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTaskHierarchy(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const task = await prisma.assignment.findUnique({ where: { id } });
  if (!task) return null;

  const children = await prisma.assignment.findMany({
    where: { parentId: id },
    include: {
      executor: { include: { position: true, user: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const childIds = children.map((c) => c.id);
  const grandchildren = childIds.length > 0
    ? await prisma.assignment.findMany({
        where: { parentId: { in: childIds } },
        include: {
          executor: { include: { position: true, user: true } },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const allChildren = [...children, ...grandchildren];
  const totalChildren = allChildren.length;
  const completedChildren = allChildren.filter((c) => c.status === "COMPLETED").length;

  return {
    task,
    children,
    grandchildren,
    progress: totalChildren > 0 ? Math.round((completedChildren / totalChildren) * 100) : 0,
  };
}

export async function updateAssignmentStatus(
  id: string,
  status: AssignmentStatus
) {
  const session = await auth();
  if (!session?.user) return { error: "Не авторизован" };

  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) return { error: "Поручение не найдено" };

  await prisma.$transaction(async (tx) => {
    const data: any = { status };
    if (status === "COMPLETED") data.completedAt = new Date();

    await tx.assignment.update({ where: { id }, data });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ASSIGNMENT_UPDATE_STATUS",
        entityType: "Assignment",
        entityId: id,
        oldStatus: assignment.status,
        newStatus: status,
      },
    });

    if (status === "COMPLETED") {
      await createNotification(
        assignment.authorId,
        "ASSIGNMENT_COMPLETED",
        "Поручение выполнено",
        `Исполнитель отметил поручение "${assignment.title}" как выполненное.`,
        "Assignment",
        id
      );
    }
  });

  revalidatePath("/assignments");
  return { error: null, success: true };
}

export async function submitReport(id: string, report: string) {
  const session = await auth();
  if (!session?.user) return { error: "Не авторизован" };

  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) return { error: "Поручение не найдено" };

  const emp = await prisma.employee.findUnique({ where: { userId: session.user.id } });
  const isExecutor = emp && assignment.executorId === emp.id;

  if (!isExecutor) return { error: "Только исполнитель может отчитаться" };
  if (assignment.status !== "IN_PROGRESS") return { error: "Поручение должно быть в статусе 'В работе'" };

  await prisma.$transaction(async (tx) => {
    await tx.assignment.update({
      where: { id },
      data: { report, status: "REPORTED" },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ASSIGNMENT_REPORT_SUBMIT",
        entityType: "Assignment",
        entityId: id,
        oldStatus: "IN_PROGRESS",
        newStatus: "REPORTED",
      },
    });

    await createNotification(
      assignment.authorId,
      "ASSIGNMENT_REPORTED",
      "Отчёт по поручению",
      `Исполнитель отчитался по поручению "${assignment.title}".`,
      "Assignment",
      id
    );
  });

  revalidatePath("/assignments");
  return { error: null, success: true };
}

export async function confirmCompletion(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Не авторизован" };

  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) return { error: "Поручение не найдено" };

  const isAuthor = assignment.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isAuthor && !isAdmin) return { error: "Только автор может подтвердить выполнение" };
  if (assignment.status !== "REPORTED") return { error: "Исполнитель ещё не отчитался" };

  await prisma.$transaction(async (tx) => {
    await tx.assignment.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ASSIGNMENT_CONFIRM",
        entityType: "Assignment",
        entityId: id,
        oldStatus: "REPORTED",
        newStatus: "COMPLETED",
      },
    });

    const execUser = await tx.employee.findUnique({
      where: { id: assignment.executorId },
      include: { user: true },
    });

    if (execUser?.userId) {
      await createNotification(
        execUser.userId,
        "ASSIGNMENT_CONFIRMED",
        "Поручение подтверждено",
        `Руководитель подтвердил выполнение поручения "${assignment.title}".`,
        "Assignment",
        id
      );
    }
  });

  revalidatePath("/assignments");
  return { error: null, success: true };
}

export async function reviseAssignment(id: string, comment: string) {
  const session = await auth();
  if (!session?.user) return { error: "Не авторизован" };

  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) return { error: "Поручение не найдено" };

  const isAuthor = assignment.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isAuthor && !isAdmin) return { error: "Только автор может вернуть на доработку" };
  if (assignment.status !== "REPORTED") return { error: "Исполнитель ещё не отчитался" };

  await prisma.$transaction(async (tx) => {
    await tx.assignment.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        report: null,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ASSIGNMENT_REVISE",
        entityType: "Assignment",
        entityId: id,
        oldStatus: "REPORTED",
        newStatus: "IN_PROGRESS",
        comment,
      },
    });

    const execUser = await tx.employee.findUnique({
      where: { id: assignment.executorId },
      include: { user: true },
    });

    if (execUser?.userId) {
      await createNotification(
        execUser.userId,
        "ASSIGNMENT_REVISE_REQUESTED",
        "Поручение возвращено на доработку",
        `Руководитель вернул поручение "${assignment.title}" на доработку: ${comment}`,
        "Assignment",
        id
      );
    }
  });

  revalidatePath("/assignments");
  return { error: null, success: true };
}

export async function getAssignmentStats(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const emp = await prisma.employee.findUnique({ where: { userId } });

  const [
    totalCreated,
    totalAsExecutor,
    pendingAsExecutor,
    inProgressAsExecutor,
    reportedAsExecutor,
    completedAsExecutor,
    overdueAsExecutor,
  ] = await Promise.all([
    prisma.assignment.count({ where: { authorId: userId } }),
    emp ? prisma.assignment.count({ where: { executorId: emp.id } }) : 0,
    emp ? prisma.assignment.count({ where: { executorId: emp.id, status: "PENDING" } }) : 0,
    emp ? prisma.assignment.count({ where: { executorId: emp.id, status: "IN_PROGRESS" } }) : 0,
    emp ? prisma.assignment.count({ where: { executorId: emp.id, status: "REPORTED" } }) : 0,
    emp ? prisma.assignment.count({ where: { executorId: emp.id, status: "COMPLETED" } }) : 0,
    emp ? prisma.assignment.count({
      where: {
        executorId: emp.id,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        deadline: { lt: new Date() },
      },
    }) : 0,
  ]);

  return {
    totalCreated,
    totalAsExecutor,
    pendingAsExecutor,
    inProgressAsExecutor,
    reportedAsExecutor,
    completedAsExecutor,
    overdueAsExecutor,
  };
}
