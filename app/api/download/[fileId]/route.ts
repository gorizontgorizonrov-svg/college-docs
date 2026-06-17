import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getAttachment(fileId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Не авторизован", status: 401 };
  }

  if (!fileId) {
    return { error: "Не указан ID файла", status: 400 };
  }

  const attachment = await prisma.fileAttachment.findUnique({
    where: { id: fileId },
  });

  if (!attachment) {
    return { error: "Файл не найден", status: 404 };
  }

  const filePath = join(process.cwd(), "private", "uploads", attachment.storedName);
  if (!existsSync(filePath)) {
    return { error: "Файл не найден на диске", status: 404 };
  }

  return { attachment, filePath };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const result = await getAttachment(fileId);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { attachment, filePath } = result;
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
        "Cache-Control": "private, max-age=2592000, immutable",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Ошибка скачивания" }, { status: 500 });
  }
}

export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const result = await getAttachment(fileId);

    if ("error" in result) {
      return new NextResponse(null, { status: result.status });
    }

    const { attachment } = result;
    const filePath = join(process.cwd(), "private", "uploads", attachment.storedName);
    const stat = await import("fs/promises").then((m) => m.stat(filePath));

    return new NextResponse(null, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": String(stat.size),
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
