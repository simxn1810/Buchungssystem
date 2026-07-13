import { NextRequest, NextResponse } from "next/server";
import { storniereMitToken } from "@/lib/buchungLogik";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fehler: "Ungültige Anfrage." }, { status: 400 });
  }

  const ergebnis = await storniereMitToken(String(body.token || ""));
  if (!ergebnis.ok) {
    return NextResponse.json({ fehler: ergebnis.fehler }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
