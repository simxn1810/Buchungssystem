import { NextRequest, NextResponse } from "next/server";
import { berechnePreisFuerBuchung } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// Preisvorschau für die im Formular gewählten Optionen.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fehler: "Ungültige Anfrage." }, { status: 400 });
  }

  try {
    const preis = await berechnePreisFuerBuchung({
      platzId: Number(body.platzId),
      datum: String(body.datum),
      startzeit: String(body.startzeit),
      dauerMinuten: Number(body.dauerMinuten),
      mitglied: Boolean(body.mitglied),
      leihschlaegerAnzahl: Number(body.leihschlaegerAnzahl) || 0,
      baelle: Boolean(body.baelle),
      ermaessigung: Boolean(body.ermaessigung),
    });
    return NextResponse.json({ preis });
  } catch {
    return NextResponse.json(
      { fehler: "Für diese Zeit ist kein Tarif hinterlegt." },
      { status: 422 }
    );
  }
}
