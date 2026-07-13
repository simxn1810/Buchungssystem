import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { istAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Buchungsübersicht. Optional gefiltert nach Datum.
export async function GET(req: NextRequest) {
  if (!istAdmin()) return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  const datum = req.nextUrl.searchParams.get("datum");
  const buchungen = await prisma.buchung.findMany({
    where: {
      status: { in: ["ausstehend", "bestaetigt"] },
      ...(datum ? { datum } : {}),
    },
    orderBy: [{ datum: "asc" }, { startzeit: "asc" }],
    include: { platz: { select: { name: true } } },
  });
  return NextResponse.json({ buchungen });
}

// Admin-Stornierung anhand der Buchungs-ID.
export async function DELETE(req: NextRequest) {
  if (!istAdmin()) return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ fehler: "Ungültige ID." }, { status: 400 });
  }
  const buchung = await prisma.buchung.findUnique({ where: { id } });
  if (!buchung) return NextResponse.json({ fehler: "Nicht gefunden." }, { status: 404 });

  await prisma.$transaction([
    prisma.belegung.deleteMany({ where: { buchungId: id } }),
    prisma.buchung.update({ where: { id }, data: { status: "storniert" } }),
  ]);
  return NextResponse.json({ ok: true });
}
