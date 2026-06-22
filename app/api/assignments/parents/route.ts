import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const parents = await prisma.assignment.findMany({
    where: {
      authorId: session.user.id,
      parentId: null,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: {
      executor: { select: { id: true, lastName: true, firstName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(parents);
}
