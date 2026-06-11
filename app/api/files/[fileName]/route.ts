import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  zip: "application/zip",
  rar: "application/x-rar-compressed",
  "7z": "application/x-7z-compressed",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { fileName } = await params;
    if (!fileName) {
      return NextResponse.json({ error: "Не указано имя файла" }, { status: 400 });
    }

    const filePath = join(process.cwd(), "private", "uploads", fileName);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }

    const file = await readFile(filePath);
    const ext = fileName.split(".").pop()?.toLowerCase();
    const mimeType = MIME_TYPES[ext || ""] || "application/octet-stream";
    const asciiName = fileName.replace(/[^\x00-\x7F]/g, "_");
    const encodedName = encodeURIComponent(fileName);

    return new NextResponse(file, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return NextResponse.json({ error: "Ошибка чтения файла" }, { status: 500 });
  }
}
