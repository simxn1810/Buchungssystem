import { prisma } from "./prisma";
import {
  alleSlots,
  istVergangen,
  zeitTomin,
  wochentagNummer,
  montagDerWoche,
  datumPlusTageAb,
} from "./time";

export type SlotStatus = "frei" | "belegt" | "gesperrt" | "abo" | "vergangen";

// Entfernt Belegungen abgelaufener, nicht bestaetigter Buchungen und markiert
// diese als storniert. So werden reservierte Slots nach Ablauf der Code-Frist
// wieder frei. Wird vor jeder Verfuegbarkeitspruefung/Buchung aufgerufen.
export async function aufraeumenAbgelaufen(): Promise<void> {
  const jetzt = new Date();
  const abgelaufen = await prisma.buchung.findMany({
    where: {
      status: "ausstehend",
      codeAblauf: { lt: jetzt },
    },
    select: { id: true },
  });
  if (abgelaufen.length === 0) return;
  const ids = abgelaufen.map((b) => b.id);
  await prisma.$transaction([
    prisma.belegung.deleteMany({ where: { buchungId: { in: ids } } }),
    prisma.buchung.updateMany({
      where: { id: { in: ids } },
      data: { status: "storniert" },
    }),
  ]);
}

// Liefert die durch Abos blockierten Slots eines Platzes an einem Datum.
// Ein Abo gilt am passenden Wochentag innerhalb seines Datumszeitraums und
// blockiert alle 15-Min-Slots im Fenster [zeitVon, zeitBis).
async function aboSlotsFuerTag(platzId: number, datum: string): Promise<Set<string>> {
  const wochentag = wochentagNummer(datum);
  const abos = await prisma.abo.findMany({
    where: {
      platzId,
      wochentag,
      datumVon: { lte: datum },
      datumBis: { gte: datum },
    },
    select: { zeitVon: true, zeitBis: true },
  });

  const belegt = new Set<string>();
  for (const abo of abos) {
    const von = zeitTomin(abo.zeitVon);
    const bis = zeitTomin(abo.zeitBis);
    for (const slot of alleSlots()) {
      const t = zeitTomin(slot);
      if (t >= von && t < bis) belegt.add(slot);
    }
  }
  return belegt;
}

// Status aller Slots eines Tages fuer einen Platz.
export async function verfuegbarkeitFuerTag(
  platzId: number,
  datum: string
): Promise<Record<string, SlotStatus>> {
  await aufraeumenAbgelaufen();

  const [belegungen, sperrungen, aboSlots] = await Promise.all([
    prisma.belegung.findMany({
      where: { platzId, datum },
      select: { slot: true },
    }),
    prisma.sperrung.findMany({
      where: { datum, OR: [{ platzId }, { platzId: null }] },
      select: { slot: true },
    }),
    aboSlotsFuerTag(platzId, datum),
  ]);

  const belegt = new Set(belegungen.map((b) => b.slot));
  const gesperrt = new Set(sperrungen.map((s) => s.slot));

  const result: Record<string, SlotStatus> = {};
  for (const slot of alleSlots()) {
    if (istVergangen(datum, slot)) result[slot] = "vergangen";
    else if (gesperrt.has(slot)) result[slot] = "gesperrt";
    else if (aboSlots.has(slot)) result[slot] = "abo";
    else if (belegt.has(slot)) result[slot] = "belegt";
    else result[slot] = "frei";
  }
  return result;
}

// Sind alle angegebenen Slots fuer einen Platz an einem Tag frei?
export async function slotsFrei(
  platzId: number,
  datum: string,
  slots: string[]
): Promise<boolean> {
  const verf = await verfuegbarkeitFuerTag(platzId, datum);
  return slots.every((s) => verf[s] === "frei");
}

// ---------------------------------------------------------------------------
// Wochen-Uebersicht (Kalender)
// ---------------------------------------------------------------------------

export type ZellStatus = "frei" | "belegt" | "gesperrt" | "abo" | "vergangen";
export type WochenUebersicht = {
  tage: string[]; // 7 Datumswerte (Mo..So)
  zeiten: string[]; // 15-Min-Startzeiten "HH:MM"
  plaetze: { id: number; name: string }[]; // Plaetze der Sportart (Spalten je Tag)
  // zellen[datum][platzId][zeit] = SlotStatus
  zellen: Record<string, Record<number, Record<string, SlotStatus>>>;
};

// Wochenuebersicht fuer eine Sportart ("tennis" | "squash") ab dem Montag der
// Woche, in der startDatum liegt. Je Tag, Platz und 15-Min-Slot der Status.
export async function wochenUebersicht(
  typ: string,
  startDatum: string
): Promise<WochenUebersicht> {
  await aufraeumenAbgelaufen();

  const montag = montagDerWoche(startDatum);
  const tage = Array.from({ length: 7 }, (_, i) => datumPlusTageAb(montag, i));

  const plaetze = await prisma.platz.findMany({
    where: { aktiv: true, typ },
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  const zeiten = alleSlots();

  const zellen: Record<string, Record<number, Record<string, SlotStatus>>> = {};

  for (const datum of tage) {
    zellen[datum] = {};
    // Verfuegbarkeit je Platz einmal laden.
    const verfProPlatz = await Promise.all(
      plaetze.map((p) => verfuegbarkeitFuerTag(p.id, datum))
    );

    plaetze.forEach((p, i) => {
      zellen[datum][p.id] = verfProPlatz[i];
    });
  }

  return { tage, zeiten, plaetze, zellen };
}
