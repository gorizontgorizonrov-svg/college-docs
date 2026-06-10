import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await params;
  const doc = await prisma.internalDocument.findUnique({
    where: { id },
    select: { id: true, title: true, content: true, status: true, authorId: true, type: true, fileUrl: true },
  });

  if (!doc) {
    return NextResponse.json({ error: "Не найден" }, { status: 404 });
  }

  return NextResponse.json(doc);
}
