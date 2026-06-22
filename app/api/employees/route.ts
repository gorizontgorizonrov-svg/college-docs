import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const employees = await prisma.employee.findMany({
    include: { position: true, department: true, user: { select: { id: true, email: true, role: true } } },
    orderBy: { lastName: "asc" },
  });
  return NextResponse.json(employees);
}
