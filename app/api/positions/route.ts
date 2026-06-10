import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const positions = await prisma.position.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(positions);
}
