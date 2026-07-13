import { NextRequest, NextResponse } from "next/server";
import { storniereMitKontakt } from "@/lib/buchungLogik";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fehler: "Ungültige Anfrage." }, { status: 400 });
  }

  const buchungId = Number(body.buchungId);
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  if (!Number.isInteger(buchungId) || !name || !email) {
    return NextResponse.json({ fehler: "Ungültige Anfrage." }, { status: 400 });
  }

  const ergebnis = await storniereMitKontakt(buchungId, name, email);
  if (!ergebnis.ok) {
    return NextResponse.json({ fehler: ergebnis.fehler }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
