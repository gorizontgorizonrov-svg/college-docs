"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";
import { computeDocumentHash, signHash } from "./signature";

export async function submitApproval(
  approvalId: string,
  decision: "APPROVE" | "REJECT" | "RETURN_TO_AUTHOR",
  comment?: string
) {
  const session = await auth();
  if (!session?.user) return { error: "Не авторизован" };

  let approval = null;
  try {
    approval = await prisma.documentApproval.findUnique({
      where: { id: approvalId },
      include: {
        document: {
          include: {
            workflow: {
              include: { stages: { orderBy: { stageOrder: "asc" } } },
            },
            approvals: {
              include: { approver: true },
            },
          },
        },
        stage: true,
      },
    });
  } catch {
    approval = await prisma.documentApproval.findUnique({
      where: { id: approvalId },
      include: {
        document: {
          include: {
            workflow: {
              include: { stages: { orderBy: { stageOrder: "asc" } } },
            },
            approvals: true,
          },
        },
        stage: true,
      },
    });
  }
  if (!approval) return { error: "Запись согласования не найдена" };
  if (approval.approverId !== session.user.id) return { error: "Нет доступа" };

  const doc = approval.document;

  await prisma.$transaction(async (tx) => {
    await tx.documentApproval.update({
      where: { id: approvalId },
      data: {
        decision,
        comment,
        decidedAt: new Date(),
      },
    });

    if (decision === "APPROVE") {
      const currentStageOrder = approval.stage?.stageOrder || 0;
      const nextStage = doc.workflow?.stages.find((s) => s.stageOrder === currentStageOrder + 1);

      if (nextStage) {
        const nextApprovals = await tx.documentApproval.findMany({
          where: {
            documentId: doc.id,
            stage: { stageOrder: nextStage.stageOrder },
          },
          include: { approver: true },
        });
        for (const na of nextApprovals) {
          await createNotification(
            na.approverId,
            "APPROVAL_REQUEST",
            "Новый документ на согласование",
            `Документ "${doc.title}" ожидает вашего согласования.`,
            "InternalDocument",
            doc.id
          );
        }
      } else {
        await tx.internalDocument.update({
          where: { id: doc.id },
          data: { status: "APPROVED" },
        });
      }
    } else if (decision === "REJECT") {
      await tx.internalDocument.update({
        where: { id: doc.id },
        data: { status: "REJECTED" },
      });

      await createNotification(
        doc.authorId,
        "DOCUMENT_REJECTED",
        "Документ отклонён",
        `Ваш документ "${doc.title}" был отклонён.${comment ? ` Причина: ${comment}` : ""}`,
        "InternalDocument",
        doc.id
      );
    } else if (decision === "RETURN_TO_AUTHOR") {
      await tx.internalDocument.update({
        where: { id: doc.id },
        data: { status: "DRAFT" },
      });

      await createNotification(
        doc.authorId,
        "DOCUMENT_RETURNED",
        "Документ возвращён на доработку",
        `Ваш документ "${doc.title}" возвращён на доработку.${comment ? ` Причина: ${comment}` : ""}`,
        "InternalDocument",
        doc.id
      );
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: decision === "APPROVE" ? "APPROVE" : decision === "REJECT" ? "REJECT" : "RETURN",
        entityType: "DocumentApproval",
        entityId: approvalId,
        comment,
      },
    });
  });

  revalidatePath(`/documents/${doc.id}`);
  return { error: null, success: true };
}

export async function submitSignature(approvalId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Не авторизован", signature: null };

  const approval = await prisma.documentApproval.findUnique({
    where: { id: approvalId },
    include: { document: true },
  });
  if (!approval) return { error: "Запись согласования не найдена", signature: null };
  if (approval.approverId !== session.user.id) return { error: "Нет доступа", signature: null };

  const employee = await prisma.employee.findUnique({ where: { userId: session.user.id } });
  if (!employee) return { error: "Профиль сотрудника не найден", signature: null };

  const docHash = await computeDocumentHash(approval.document.content || "");
  const encryptedSig = await signHash(docHash);

  const signature = await prisma.$transaction(async (tx) => {
    const sig = await tx.digitalSignature.create({
      data: {
        documentId: approval.document.id,
        employeeId: employee.id,
        userId: session.user.id,
        signatureData: encryptedSig,
        documentHash: docHash,
        isVerified: true,
      },
    });

    await tx.documentApproval.update({
      where: { id: approvalId },
      data: { signatureId: sig.id, decidedAt: new Date(), decision: "APPROVE" },
    });

    const allApprovals = await tx.documentApproval.findMany({
      where: { documentId: approval.document.id },
    });

    const allDecided = allApprovals.every((a) => a.decision !== null);
    if (allDecided) {
      await tx.internalDocument.update({
        where: { id: approval.document.id },
        data: { status: "APPROVED" },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SIGN",
        entityType: "DigitalSignature",
        entityId: sig.id,
      },
    });

    return sig;
  });

  revalidatePath(`/documents/${approval.document.id}`);
  return { error: null, signature };
}

export async function verifySignature(signatureId: string) {
  const { decrypt } = await import("@/lib/crypto");
  const signature = await prisma.digitalSignature.findUnique({ where: { id: signatureId } });
  if (!signature) return { isValid: false, error: "Подпись не найдена" };

  try {
    const decrypted = decrypt(signature.signatureData);
    const isValid = decrypted === signature.documentHash;

    await prisma.digitalSignature.update({
      where: { id: signatureId },
      data: { isVerified: isValid },
    });

    return { isValid };
  } catch {
    return { isValid: false };
  }
}
