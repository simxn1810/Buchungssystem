import { prisma } from "./prisma";
import { alleSlots, istVergangen } from "./time";

export type SlotStatus = "frei" | "belegt" | "gesperrt" | "vergangen";

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

// Status aller Slots eines Tages fuer einen Platz.
export async function verfuegbarkeitFuerTag(
  platzId: number,
  datum: string
): Promise<Record<string, SlotStatus>> {
  await aufraeumenAbgelaufen();

  const [belegungen, sperrungen] = await Promise.all([
    prisma.belegung.findMany({
      where: { platzId, datum },
      select: { slot: true },
    }),
    prisma.sperrung.findMany({
      where: { datum, OR: [{ platzId }, { platzId: null }] },
      select: { slot: true },
    }),
  ]);

  const belegt = new Set(belegungen.map((b) => b.slot));
  const gesperrt = new Set(sperrungen.map((s) => s.slot));

  const result: Record<string, SlotStatus> = {};
  for (const slot of alleSlots()) {
    if (istVergangen(datum, slot)) result[slot] = "vergangen";
    else if (gesperrt.has(slot)) result[slot] = "gesperrt";
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
