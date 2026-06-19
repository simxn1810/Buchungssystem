import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const plaetze = await prisma.platz.findMany({
    where: { aktiv: true },
    orderBy: { id: "asc" },
    select: { id: true, name: true, typ: true },
  });
  return NextResponse.json({ plaetze });
}
