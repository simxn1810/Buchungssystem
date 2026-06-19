import { NextRequest, NextResponse } from "next/server";
import { verfuegbarkeitFuerTag } from "@/lib/availability";
import { imBuchungshorizont } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const platzId = Number(req.nextUrl.searchParams.get("platzId"));
  const datum = req.nextUrl.searchParams.get("datum") || "";

  if (!Number.isInteger(platzId) || platzId <= 0) {
    return NextResponse.json({ fehler: "Ungueltiger Platz." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
    return NextResponse.json({ fehler: "Ungueltiges Datum." }, { status: 400 });
  }
  if (!imBuchungshorizont(datum)) {
    return NextResponse.json({ slots: {}, ausserhalb: true });
  }

  const slots = await verfuegbarkeitFuerTag(platzId, datum);
  return NextResponse.json({ slots });
}
