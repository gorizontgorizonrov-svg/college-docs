import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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

    const filePath = join(process.cwd(), "private", "uploads", "avatars", fileName);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }

    const file = await readFile(filePath);
    const ext = fileName.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
      gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
    };
    const mimeType = mimeTypes[ext || ""] || "application/octet-stream";

    return new NextResponse(file, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=2592000, immutable",
      },
    });
  } catch (error) {
    console.error("Avatar serve error:", error);
    return NextResponse.json({ error: "Ошибка чтения файла" }, { status: 500 });
  }
}
