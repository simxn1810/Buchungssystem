import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { istAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Reihenfolge für eine sinnvolle Anzeige (Mo..Fr, Sa, So).
const REIHENFOLGE = ["montag", "dienstag", "mittwoch", "donnerstag", "freitag", "samstag", "sonntag"];

export async function GET() {
  if (!istAdmin()) return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  const codes = await prisma.zugangscode.findMany();
  codes.sort((a, b) => REIHENFOLGE.indexOf(a.wochentag) - REIHENFOLGE.indexOf(b.wochentag));
  return NextResponse.json({ codes });
}

// Aktualisiert bzw. legt Zugangscodes je Wochentag an.
export async function PUT(req: NextRequest) {
  if (!istAdmin()) return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fehler: "Ungültige Anfrage." }, { status: 400 });
  }
  const updates: { wochentag: string; code: string }[] = Array.isArray(body.updates)
    ? body.updates
    : [];

  const gueltig = updates.filter(
    (u) =>
      typeof u.wochentag === "string" &&
      REIHENFOLGE.includes(u.wochentag) &&
      typeof u.code === "string"
  );

  await prisma.$transaction(
    gueltig.map((u) =>
      prisma.zugangscode.upsert({
        where: { wochentag: u.wochentag },
        update: { code: u.code.trim() },
        create: { wochentag: u.wochentag, code: u.code.trim() },
      })
    )
  );
  return NextResponse.json({ ok: true });
}
