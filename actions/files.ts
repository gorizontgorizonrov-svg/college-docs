"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { join } from "path";

export async function getFileAttachments(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  return prisma.fileAttachment.findMany({
    where: { documentId },
    include: {
      uploadedBy: {
        include: { employee: { include: { position: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getIncomingFileAttachments(incomingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  return prisma.fileAttachment.findMany({
    where: { incomingId },
    include: {
      uploadedBy: {
        include: { employee: { include: { position: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function attachFileToDocument(
  documentId: string,
  data: {
    originalName: string;
    storedName: string;
    mimeType: string;
    fileSize: number;
    fileUrl: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const attachment = await prisma.fileAttachment.create({
    data: {
      documentId,
      originalName: data.originalName,
      storedName: data.storedName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      uploadedById: session.user.id,
      fileUrl: data.fileUrl,
    },
  });

  revalidatePath(`/documents/${documentId}`);
  return attachment;
}

export async function attachFileToIncoming(
  incomingId: string,
  data: {
    originalName: string;
    storedName: string;
    mimeType: string;
    fileSize: number;
    fileUrl: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const attachment = await prisma.fileAttachment.create({
    data: {
      incomingId,
      originalName: data.originalName,
      storedName: data.storedName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      uploadedById: session.user.id,
      fileUrl: data.fileUrl,
    },
  });

  revalidatePath(`/incoming/${incomingId}`);
  return attachment;
}

export async function trackDownload(fileId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const [attachment] = await Promise.all([
    prisma.fileAttachment.update({
      where: { id: fileId },
      data: { downloadCount: { increment: 1 } },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOWNLOAD",
        entityType: "FileAttachment",
        entityId: fileId,
      },
    }),
  ]);

  return attachment;
}

/** @used-by: future features (FileDownload revert, admin file manager) */
export async function getFileById(fileId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  return prisma.fileAttachment.findUnique({
    where: { id: fileId },
    include: {
      uploadedBy: { include: { employee: { include: { position: true } } } },
    },
  });
}

export async function downloadAllAsZip(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Не авторизован");

  const files = await prisma.fileAttachment.findMany({
    where: { documentId },
  });

  if (files.length === 0) throw new Error("Нет файлов для скачивания");

  const { ZipArchive } = await import("archiver");
  const { createWriteStream, existsSync } = await import("fs");
  const { mkdir, unlink } = await import("fs/promises");

  const zipDir = join(process.cwd(), "private", "temp");

  if (!existsSync(zipDir)) {
    await mkdir(zipDir, { recursive: true });
  }

  const zipName = `doc-${documentId}-${Date.now()}.zip`;
  const zipPath = join(zipDir, zipName);

  return new Promise<string>((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = new ZipArchive({ zlib: { level: 5 } });

    output.on("close", async () => {
      for (const file of files) {
        await prisma.fileAttachment.update({
          where: { id: file.id },
          data: { downloadCount: { increment: 1 } },
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DOWNLOAD",
          entityType: "InternalDocument",
          entityId: documentId,
          comment: `ZIP archive with ${files.length} files`,
        },
      });

      setTimeout(async () => {
        try { await unlink(zipPath); } catch {}
      }, 60 * 60 * 1000);

      resolve(zipName);
    });

    archive.on("error", reject);

    archive.pipe(output);

    for (const file of files) {
      const filePath = join(process.cwd(), "private", "uploads", file.storedName);
      archive.file(filePath, { name: file.originalName });
    }

    archive.finalize();
  });
}
