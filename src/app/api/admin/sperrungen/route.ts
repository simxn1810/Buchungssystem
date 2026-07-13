import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { istAdmin } from "@/lib/admin";
import { zeitTomin, minToZeit, SLOT_MINUTEN } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!istAdmin()) return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  const datum = req.nextUrl.searchParams.get("datum");
  const sperrungen = await prisma.sperrung.findMany({
    where: datum ? { datum } : undefined,
    orderBy: [{ datum: "asc" }, { slot: "asc" }],
    include: { platz: { select: { name: true } } },
  });
  return NextResponse.json({ sperrungen });
}

// Legt Sperrungen für einen Zeitraum an (von/bis in 15-Min-Schritten).
// platzId = null sperrt alle Plätze.
export async function POST(req: NextRequest) {
  if (!istAdmin()) return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fehler: "Ungültige Anfrage." }, { status: 400 });
  }

  const datum = String(body.datum || "");
  const von = String(body.von || "");
  const bis = String(body.bis || "");
  const grund = String(body.grund || "").trim();

  // platzIds (Array) hat Vorrang, sonst einzelnes platzId; null = alle Plätze.
  let platzIds: (number | null)[];
  if (Array.isArray(body.platzIds)) {
    platzIds = body.platzIds.map((p: unknown) => Number(p));
  } else {
    const platzId = body.platzId === null || body.platzId === "" || body.platzId === undefined
      ? null
      : Number(body.platzId);
    platzIds = [platzId];
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || !/^\d{2}:\d{2}$/.test(von) || !/^\d{2}:\d{2}$/.test(bis)) {
    return NextResponse.json({ fehler: "Ungültige Eingabe." }, { status: 400 });
  }
  if (!grund) return NextResponse.json({ fehler: "Bitte einen Grund angeben." }, { status: 400 });
  if (zeitTomin(bis) <= zeitTomin(von)) {
    return NextResponse.json({ fehler: "Endzeit muss nach Startzeit liegen." }, { status: 400 });
  }

  const slots: string[] = [];
  for (let t = zeitTomin(von); t < zeitTomin(bis); t += SLOT_MINUTEN) {
    slots.push(minToZeit(t));
  }

  await prisma.sperrung.createMany({
    data: platzIds.flatMap((platzId) =>
      slots.map((slot) => ({ platzId, datum, slot, grund }))
    ),
  });

  return NextResponse.json({ ok: true, anzahl: slots.length * platzIds.length });
}

export async function DELETE(req: NextRequest) {
  if (!istAdmin()) return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  const datum = req.nextUrl.searchParams.get("datum");
  const grund = req.nextUrl.searchParams.get("grund");

  // Löschen einzeln (id) oder gruppenweise (datum + grund) möglich.
  if (Number.isInteger(id) && id > 0) {
    await prisma.sperrung.delete({ where: { id } });
  } else if (datum && grund) {
    await prisma.sperrung.deleteMany({ where: { datum, grund } });
  } else {
    return NextResponse.json({ fehler: "Ungültige Anfrage." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
