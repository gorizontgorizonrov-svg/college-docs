import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { existsSync } from "fs";
import { auth } from "@/auth";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp", "image/bmp", "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv", "text/rtf",
  "application/rtf",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "application/zip", "application/x-rar-compressed", "application/x-zip-compressed",
  "application/x-7z-compressed", "application/gzip", "application/x-tar",
  "application/json", "application/xml", "text/xml",
];

const FORBIDDEN_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".sh", ".dll", ".vbs", ".msi", ".jar", ".py", ".js",
  ".jse", ".wsf", ".wsh", ".ps1", ".psm1", ".vba", ".scr", ".cpl",
];

const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "application/pdf": [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
  "image/jpeg": [new Uint8Array([0xFF, 0xD8, 0xFF])],
  "image/png": [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
  "image/gif": [new Uint8Array([0x47, 0x49, 0x46])],
  "application/zip": [new Uint8Array([0x50, 0x4B, 0x03, 0x04])],
};

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

    const extension = extname(file.name).toLowerCase();
    if (FORBIDDEN_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ error: "Недопустимый тип файла" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Недопустимый MIME-тип файла" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `Файл слишком большой (максимум ${MAX_SIZE_MB} МБ)` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const magicCheck = MAGIC_BYTES[file.type];
    if (magicCheck) {
      const matchesMagic = magicCheck.some((sig) =>
        sig.every((byte, idx) => buffer[idx] === byte)
      );
      if (!matchesMagic) {
        return NextResponse.json({ error: "Содержимое файла не соответствует типу" }, { status: 400 });
      }
    }

    const uploadDir = join(process.cwd(), "private", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const safeName = file.name.replace(/[^a-zA-Z0-9.\u0400-\u04FF-]/g, "_");
    const fileName = `${uniqueSuffix}-${safeName}`;
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
      storedName: fileName,
      fileSize: file.size,
      mimeType: file.type,
      typeLabel: fileTypeLabels[file.type] || "Файл",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
