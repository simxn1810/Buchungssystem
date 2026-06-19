import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

// Endpoint fuer die automatische DSGVO-Loeschung. Kann z. B. per Vercel Cron
// aufgerufen werden. Optional mit CRON_SECRET absichern.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });
    }
  }
  const grenze = new Date(Date.now() - config.datenLoeschTage * 24 * 60 * 60 * 1000);
  const result = await prisma.buchung.deleteMany({
    where: { erstelltAm: { lt: grenze } },
  });
  return NextResponse.json({ geloescht: result.count });
}
