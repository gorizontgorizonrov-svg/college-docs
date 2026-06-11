import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ZipArchive } from "archiver";
import { createWriteStream, existsSync } from "fs";
import { mkdir, readFile, unlink } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    let documentId: string | null = null;
    let incomingId: string | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      documentId = body.documentId;
      incomingId = body.incomingId;
    } else {
      const formData = await request.formData();
      documentId = formData.get("documentId") as string | null;
      incomingId = formData.get("incomingId") as string | null;
    }

    const id = documentId || incomingId;

    if (!id) {
      return NextResponse.json({ error: "Не указан ID документа" }, { status: 400 });
    }

    const files = await prisma.fileAttachment.findMany({
      where: documentId ? { documentId: id } : { incomingId: id },
    });

    if (files.length === 0) {
      return NextResponse.json({ error: "Нет файлов для скачивания" }, { status: 404 });
    }

    const tempDir = join(process.cwd(), "private", "temp");
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    const zipName = `doc-${id}-${Date.now()}.zip`;
    const zipPath = join(tempDir, zipName);

    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = new ZipArchive({ zlib: { level: 5 } });

      output.on("close", resolve);
      archive.on("error", reject);

      archive.pipe(output);

      for (const file of files) {
        const filePath = join(process.cwd(), "private", "uploads", file.storedName);
        if (existsSync(filePath)) {
          archive.file(filePath, { name: file.originalName });
        }
      }

      archive.finalize();
    });

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
        entityType: documentId ? "InternalDocument" : "IncomingDocument",
        entityId: id,
        comment: `ZIP (${files.length} файлов)`,
      },
    });

    setTimeout(async () => {
      try { await unlink(zipPath); } catch {}
    }, 60 * 60 * 1000);

    const buffer = await readFile(zipPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("ZIP download error:", error);
    return NextResponse.json({ error: "Ошибка создания архива" }, { status: 500 });
  }
}
