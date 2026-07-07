import { NextRequest, NextResponse } from "next/server";
import { wochenUebersicht } from "@/lib/availability";
import { heuteISO } from "@/lib/time";

export const dynamic = "force-dynamic";

// Wochen-Uebersicht fuer die Kalenderansicht (nur lesend, oeffentlich).
// Parameter: typ = "tennis" | "squash", start = "YYYY-MM-DD" (optional).
export async function GET(req: NextRequest) {
  const typ = req.nextUrl.searchParams.get("typ") || "";
  const start = req.nextUrl.searchParams.get("start") || "";

  if (typ !== "tennis" && typ !== "squash") {
    return NextResponse.json({ fehler: "Ungueltige Sportart." }, { status: 400 });
  }
  const startDatum = /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : heuteISO();

  const daten = await wochenUebersicht(typ, startDatum);
  return NextResponse.json(daten);
}
