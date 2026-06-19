import { NextRequest, NextResponse } from "next/server";
import { bestaetigeBuchung } from "@/lib/buchungLogik";

export const dynamic = "force-dynamic";

function baseUrlAus(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fehler: "Ungueltige Anfrage." }, { status: 400 });
  }

  const buchungId = Number(body.buchungId);
  const code = String(body.code || "");
  if (!Number.isInteger(buchungId) || !/^\d{6}$/.test(code.trim())) {
    return NextResponse.json({ fehler: "Bitte einen 6-stelligen Code eingeben." }, { status: 400 });
  }

  const ergebnis = await bestaetigeBuchung(buchungId, code, baseUrlAus(req));
  if (!ergebnis.ok) {
    return NextResponse.json({ fehler: ergebnis.fehler }, { status: 400 });
  }
  return NextResponse.json({ buchung: ergebnis.data });
}
