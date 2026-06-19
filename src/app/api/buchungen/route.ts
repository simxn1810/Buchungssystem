import { NextRequest, NextResponse } from "next/server";
import { erstelleVorlaeufigeBuchung } from "@/lib/buchungLogik";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fehler: "Ungueltige Anfrage." }, { status: 400 });
  }

  const ergebnis = await erstelleVorlaeufigeBuchung({
    platzId: Number(body.platzId),
    datum: String(body.datum || ""),
    startzeit: String(body.startzeit || ""),
    dauerMinuten: Number(body.dauerMinuten),
    name: String(body.name || ""),
    kontakt: String(body.kontakt || ""),
    mitglied: Boolean(body.mitglied),
    leihschlaegerAnzahl: Number(body.leihschlaegerAnzahl) || 0,
    baelle: Boolean(body.baelle),
    ermaessigung: Boolean(body.ermaessigung),
    einwilligung: Boolean(body.einwilligung),
  });

  if (!ergebnis.ok) {
    return NextResponse.json({ fehler: ergebnis.fehler }, { status: 400 });
  }
  return NextResponse.json({
    buchungId: ergebnis.data.buchungId,
    kontaktTyp: ergebnis.data.kontaktTyp,
  });
}
