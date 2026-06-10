import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { auth } from "@/auth";

const ALLOWED_TYPES = [
  // Изображения
  "image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp", "image/bmp", "image/svg+xml",
  // Документы
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv", "text/rtf",
  "application/rtf",
  // Открытые форматы
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  // Архивы
  "application/zip", "application/x-rar-compressed", "application/x-zip-compressed",
  "application/x-7z-compressed", "application/gzip", "application/x-tar",
  // Другое
  "application/json", "application/xml", "text/xml",
];
const MAX_SIZE = 50 * 1024 * 1024;
const MAX_SIZE_MB = 50;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Файл не загружен" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Недопустимый тип файла" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `Файл слишком большой (максимум ${MAX_SIZE_MB} МБ)` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "private", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const fileName = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const fileTypeLabels: Record<string, string> = {
      "application/pdf": "PDF",
      "application/msword": "Word",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
      "application/vnd.ms-excel": "Excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
      "application/vnd.ms-powerpoint": "PowerPoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint",
      "text/plain": "Текст",
      "text/csv": "CSV",
      "image/jpeg": "Изображение",
      "image/png": "Изображение",
      "image/gif": "Изображение",
      "application/zip": "Архив",
      "application/x-rar-compressed": "Архив",
    };

    return NextResponse.json({
      success: true,
      url: `/api/files/${fileName}`,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      typeLabel: fileTypeLabels[file.type] || "Файл",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
