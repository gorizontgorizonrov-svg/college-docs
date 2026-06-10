import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { fileName } = await params;
    const filePath = join(process.cwd(), "private", "uploads", fileName);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }

    const internalDoc = await prisma.internalDocument.findFirst({
      where: { fileUrl: { equals: `/api/files/${fileName}` } },
    });
    const incomingDoc = await prisma.incomingDocument.findFirst({
      where: { fileUrl: { equals: `/api/files/${fileName}` } },
    });

    const isAuthor = internalDoc?.authorId === session.user.id;
    const isAdminOrRegistrar = ["ADMIN", "REGISTRAR", "VALIDATOR", "SIGNER"].includes(session.user.role as string);
    const isIncomingRelated = incomingDoc && ["REGISTRAR", "ADMIN"].includes(session.user.role as string);

    if (!isAuthor && !isAdminOrRegistrar && !isIncomingRelated) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const file = await readFile(filePath);
    const mimeType = fileName.endsWith(".pdf")
      ? "application/pdf"
      : fileName.endsWith(".png")
      ? "image/png"
      : fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")
      ? "image/jpeg"
      : "application/octet-stream";

    return new NextResponse(file, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return NextResponse.json({ error: "Ошибка чтения файла" }, { status: 500 });
  }
}
