/**
 * Скрипт миграции: создаёт FileAttachment для существующих документов, у которых
 * есть fileUrl, но нет записей в FileAttachment.
 *
 * Запуск: npx tsx prisma/migrate-files.ts
 */

import { PrismaClient } from "@prisma/client";
import { existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Миграция файлов: InternalDocument ===");

  const docs = await prisma.internalDocument.findMany({
    where: {
      fileUrl: { not: null },
      NOT: {
        fileAttachments: { some: {} },
      },
    },
    include: { author: true },
  });

  console.log(`Найдено документов без FileAttachment: ${docs.length}`);

  let created = 0;
  for (const doc of docs) {
    const fileUrl = doc.fileUrl!;
    const storedName = fileUrl.replace("/api/files/", "");
    const filePath = join(process.cwd(), "private", "uploads", storedName);

    if (!existsSync(filePath)) {
      console.warn(`  ⚠ Файл не найден на диске: ${storedName} (doc ${doc.id})`);
      continue;
    }

    const ext = storedName.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
      txt: "text/plain",
      csv: "text/csv",
      json: "application/json",
      xml: "application/xml",
    };

    const mimeType = mimeTypes[ext] || "application/octet-stream";
    const originalName = storedName.replace(/^\d+-[a-z0-9]+-/i, "");

    const stat = existsSync(filePath) ? await import("fs/promises").then((m) => m.stat(filePath)) : null;

    await prisma.fileAttachment.create({
      data: {
        documentId: doc.id,
        originalName: originalName || storedName,
        storedName,
        mimeType,
        fileSize: stat?.size || 0,
        uploadedById: doc.authorId,
        fileUrl,
      },
    });
    created++;
  }

  console.log(`  ✓ Создано FileAttachment для документов: ${created}`);

  console.log("\n=== Миграция файлов: IncomingDocument ===");

  const incoming = await prisma.incomingDocument.findMany({
    where: {
      fileUrl: { not: null },
      NOT: {
        fileAttachments: { some: {} },
      },
    },
  });

  console.log(`Найдено входящих без FileAttachment: ${incoming.length}`);

  let incomingCreated = 0;
  for (const doc of incoming) {
    const fileUrl = doc.fileUrl!;
    const storedName = fileUrl.replace("/api/files/", "");
    const filePath = join(process.cwd(), "private", "uploads", storedName);

    if (!existsSync(filePath)) {
      console.warn(`  ⚠ Файл не найден на диске: ${storedName} (incoming ${doc.id})`);
      continue;
    }

    const ext = storedName.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      zip: "application/zip",
      txt: "text/plain",
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";
    const originalName = storedName.replace(/^\d+-[a-z0-9]+-/i, "");

    const stat = existsSync(filePath) ? await import("fs/promises").then((m) => m.stat(filePath)) : null;

    await prisma.fileAttachment.create({
      data: {
        incomingId: doc.id,
        originalName: originalName || storedName,
        storedName,
        mimeType,
        fileSize: stat?.size || 0,
        uploadedById: doc.createdById,
        fileUrl,
      },
    });
    incomingCreated++;
  }

  console.log(`  ✓ Создано FileAttachment для входящих: ${incomingCreated}`);
  console.log("\n=== Миграция завершена ===");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
