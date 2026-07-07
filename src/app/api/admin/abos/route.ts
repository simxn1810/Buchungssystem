import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { istAdmin } from "@/lib/admin";
import { zeitTomin } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!istAdmin()) return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  const abos = await prisma.abo.findMany({
    orderBy: [{ wochentag: "asc" }, { zeitVon: "asc" }],
    include: { platz: { select: { name: true } } },
  });
  return NextResponse.json({ abos });
}

// Legt ein Abo (wiederkehrende Reservierung) an.
export async function POST(req: NextRequest) {
  if (!istAdmin()) return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fehler: "Ungueltige Anfrage." }, { status: 400 });
  }

  const platzId = Number(body.platzId);
  const wochentag = Number(body.wochentag);
  const zeitVon = String(body.zeitVon || "");
  const zeitBis = String(body.zeitBis || "");
  const datumVon = String(body.datumVon || "");
  const datumBis = String(body.datumBis || "");
  const titel = String(body.titel || "").trim();

  if (!Number.isInteger(platzId) || platzId <= 0) {
    return NextResponse.json({ fehler: "Ungueltiger Platz." }, { status: 400 });
  }
  if (!Number.isInteger(wochentag) || wochentag < 0 || wochentag > 6) {
    return NextResponse.json({ fehler: "Ungueltiger Wochentag." }, { status: 400 });
  }
  if (!/^\d{2}:\d{2}$/.test(zeitVon) || !/^\d{2}:\d{2}$/.test(zeitBis)) {
    return NextResponse.json({ fehler: "Ungueltige Uhrzeit." }, { status: 400 });
  }
  if (zeitTomin(zeitBis) <= zeitTomin(zeitVon)) {
    return NextResponse.json({ fehler: "Endzeit muss nach Startzeit liegen." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datumVon) || !/^\d{4}-\d{2}-\d{2}$/.test(datumBis)) {
    return NextResponse.json({ fehler: "Ungueltiges Datum." }, { status: 400 });
  }
  if (datumBis < datumVon) {
    return NextResponse.json({ fehler: "End-Datum muss nach Start-Datum liegen." }, { status: 400 });
  }
  if (!titel) {
    return NextResponse.json({ fehler: "Bitte eine Bezeichnung angeben." }, { status: 400 });
  }

  const platz = await prisma.platz.findUnique({ where: { id: platzId } });
  if (!platz || !platz.aktiv) {
    return NextResponse.json({ fehler: "Platz nicht verfuegbar." }, { status: 400 });
  }

  const abo = await prisma.abo.create({
    data: { platzId, wochentag, zeitVon, zeitBis, datumVon, datumBis, titel },
  });
  return NextResponse.json({ ok: true, abo });
}

export async function DELETE(req: NextRequest) {
  if (!istAdmin()) return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ fehler: "Ungueltige Anfrage." }, { status: 400 });
  }
  await prisma.abo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
