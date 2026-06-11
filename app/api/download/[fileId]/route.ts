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
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { fileId } = await params;
    if (!fileId) {
      return NextResponse.json({ error: "Не указан ID файла" }, { status: 400 });
    }

    const attachment = await prisma.fileAttachment.findUnique({
      where: { id: fileId },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }

    const filePath = join(process.cwd(), "private", "uploads", attachment.storedName);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Файл не найден на диске" }, { status: 404 });
    }

    const buffer = await readFile(filePath);

    await prisma.fileAttachment.update({
      where: { id: fileId },
      data: { downloadCount: { increment: 1 } },
    });

    const asciiName = attachment.originalName.replace(/[^\x00-\x7F]/g, "_");
    const encodedName = encodeURIComponent(attachment.originalName);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Ошибка скачивания" }, { status: 500 });
  }
}
