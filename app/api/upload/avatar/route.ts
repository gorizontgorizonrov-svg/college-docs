import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { auth } from "@/auth";
import { getAvatarsDir } from "@/lib/paths";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Только изображения" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Максимум 5 МБ" }, { status: 400 });
    }

    const uploadDir = getAvatarsDir();
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const ext = file.name.split(".").pop() || "png";
    const fileName = `avatar-${session.user.id}-${Date.now()}.${ext}`;
    const filePath = join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const avatarUrl = `/api/files/avatars/${fileName}`;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { employee: true },
    });

    if (user?.employee) {
      await prisma.employee.update({
        where: { id: user.employee.id },
        data: { avatarUrl },
      });
    }

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Avatar upload error:", msg);
    return NextResponse.json({ error: `Ошибка загрузки: ${msg}` }, { status: 500 });
  }
}
