import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { istAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!istAdmin()) return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  const tarife = await prisma.tarif.findMany({
    orderBy: [{ sportart: "asc" }, { saison: "asc" }, { mitglied: "desc" }, { wochentagGruppe: "asc" }, { zeitVon: "asc" }],
  });
  return NextResponse.json({ tarife });
}

// Aktualisiert den Stundenpreis (in Cent) einzelner Tarifzeilen.
export async function PUT(req: NextRequest) {
  if (!istAdmin()) return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fehler: "Ungueltige Anfrage." }, { status: 400 });
  }
  const updates: { id: number; preisProStundeCent: number }[] = Array.isArray(body.updates)
    ? body.updates
    : [];

  await prisma.$transaction(
    updates
      .filter((u) => Number.isInteger(u.id) && Number.isFinite(u.preisProStundeCent) && u.preisProStundeCent >= 0)
      .map((u) =>
        prisma.tarif.update({
          where: { id: u.id },
          data: { preisProStundeCent: Math.round(u.preisProStundeCent) },
        })
      )
  );
  return NextResponse.json({ ok: true });
}
