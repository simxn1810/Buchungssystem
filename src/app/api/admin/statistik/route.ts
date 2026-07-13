import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { istAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const MONATS_LABEL = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

type Zeile = {
  label: string;
  umsatzCent: number;
  stundenTennis: number;
  stundenSquash: number;
  buchungenAnzahl: number;
};

// Aggregiert bestätigte Buchungen zu Umsatz/Belegung je Monat (Jahresansicht)
// oder je Tag (Monatsansicht). Nur bestätigte Buchungen zählen als Umsatz –
// stornierte und nie bestätigte (Code-Eingabe fehlt) Reservierungen sind kein
// tatsächlich eingenommenes Geld und fließen daher nicht in die Kassenkontrolle ein.
export async function GET(req: NextRequest) {
  if (!istAdmin()) return NextResponse.json({ fehler: "Nicht autorisiert." }, { status: 401 });

  const url = new URL(req.url);
  const heute = new Date();
  const jahr = Number(url.searchParams.get("jahr")) || heute.getFullYear();
  const monatParam = url.searchParams.get("monat");
  const monat = monatParam ? Number(monatParam) : null;

  // Verfügbare Jahre für die Auswahl ermitteln (aus allen bestätigten Buchungen).
  const alleDaten = await prisma.buchung.findMany({
    where: { status: "bestaetigt" },
    select: { datum: true },
  });
  const jahreSet = new Set(alleDaten.map((b) => Number(b.datum.slice(0, 4))));
  jahreSet.add(heute.getFullYear());
  const jahre = Array.from(jahreSet).sort((a, b) => b - a);

  const praefix = monat ? `${jahr}-${String(monat).padStart(2, "0")}` : `${jahr}`;
  const buchungen = await prisma.buchung.findMany({
    where: { status: "bestaetigt", datum: { startsWith: praefix } },
    select: {
      datum: true,
      dauerMinuten: true,
      gesamtpreisCent: true,
      platz: { select: { typ: true } },
    },
  });

  let reihen: Zeile[];
  if (monat) {
    // Monatsansicht: eine Zeile je Kalendertag.
    const anzahlTage = new Date(jahr, monat, 0).getDate();
    reihen = Array.from({ length: anzahlTage }, (_, i) => ({
      label: String(i + 1).padStart(2, "0"),
      umsatzCent: 0,
      stundenTennis: 0,
      stundenSquash: 0,
      buchungenAnzahl: 0,
    }));
    for (const b of buchungen) {
      const tag = Number(b.datum.slice(8, 10));
      const zeile = reihen[tag - 1];
      if (!zeile) continue;
      zeile.umsatzCent += b.gesamtpreisCent;
      zeile.buchungenAnzahl += 1;
      if (b.platz.typ === "tennis") zeile.stundenTennis += b.dauerMinuten / 60;
      else zeile.stundenSquash += b.dauerMinuten / 60;
    }
  } else {
    // Jahresansicht: eine Zeile je Monat.
    reihen = MONATS_LABEL.map((label) => ({
      label,
      umsatzCent: 0,
      stundenTennis: 0,
      stundenSquash: 0,
      buchungenAnzahl: 0,
    }));
    for (const b of buchungen) {
      const m = Number(b.datum.slice(5, 7));
      const zeile = reihen[m - 1];
      if (!zeile) continue;
      zeile.umsatzCent += b.gesamtpreisCent;
      zeile.buchungenAnzahl += 1;
      if (b.platz.typ === "tennis") zeile.stundenTennis += b.dauerMinuten / 60;
      else zeile.stundenSquash += b.dauerMinuten / 60;
    }
  }

  const summe = reihen.reduce(
    (acc, z) => ({
      umsatzCent: acc.umsatzCent + z.umsatzCent,
      stundenTennis: acc.stundenTennis + z.stundenTennis,
      stundenSquash: acc.stundenSquash + z.stundenSquash,
      buchungenAnzahl: acc.buchungenAnzahl + z.buchungenAnzahl,
    }),
    { umsatzCent: 0, stundenTennis: 0, stundenSquash: 0, buchungenAnzahl: 0 }
  );

  return NextResponse.json({ jahre, jahr, monat, reihen, summe });
}
