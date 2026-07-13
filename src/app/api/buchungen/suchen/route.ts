import { NextRequest, NextResponse } from "next/server";
import { findeBuchungenFuerKontakt } from "@/lib/buchungLogik";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fehler: "Ungültige Anfrage." }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  if (!name || !email) {
    return NextResponse.json({ fehler: "Bitte Name und E-Mail angeben." }, { status: 400 });
  }

  const buchungen = await findeBuchungenFuerKontakt(name, email);
  return NextResponse.json({ buchungen });
}
