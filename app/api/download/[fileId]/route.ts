import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  console.error("=== DOWNLOAD ROUTE HIT ===");
  try {
    const session = await auth();
    if (!session?.user) {
      console.error("Download: no session");
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("Download: session OK, user:", session.user.id);

    const { fileId } = await params;
    console.error("Download: fileId:", fileId);
    if (!fileId) {
      return NextResponse.json({ error: "Не указан ID файла" }, { status: 400 });
    }

    const attachment = await prisma.fileAttachment.findUnique({
      where: { id: fileId },
    });
    console.error("Download: attachment found:", !!attachment);

    if (!attachment) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }

    const filePath = join(process.cwd(), "private", "uploads", attachment.storedName);
    console.error("Download: filePath:", filePath, "exists:", existsSync(filePath));

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Файл не найден на диске" }, { status: 404 });
    }

    console.error("Download: updating download count");
    await prisma.fileAttachment.update({
      where: { id: fileId },
      data: { downloadCount: { increment: 1 } },
    });

    console.error("Download: creating audit log");
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOWNLOAD",
        entityType: "FileAttachment",
        entityId: fileId,
      },
    }).catch(() => { console.error("Download: audit log failed (ignored)"); });

    console.error("Download: reading file");
    const buffer = await readFile(filePath);
    console.error("Download: read OK, size:", buffer.length);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.originalName}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    if (error instanceof Error) {
      console.error("Download error message:", error.message);
      console.error("Download error stack:", error.stack);
    }
    return NextResponse.json({ error: "Ошибка скачивания" }, { status: 500 });
  }
}
