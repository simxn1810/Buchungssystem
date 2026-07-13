import { prisma } from "./prisma";
import { config } from "./config";
import { zeitTomin, slotsFuerBuchung, wochentagGruppe, SLOT_MINUTEN } from "./time";
import { saisonFuerDatum } from "./season";

export type TarifZeile = {
  sportart: string;
  saison: string;
  mitglied: boolean;
  wochentagGruppe: string;
  zeitVon: string;
  zeitBis: string;
  preisProStundeCent: number;
};

export type PreisAufschluesselung = {
  platzCent: number;
  leihschlaegerCent: number;
  ballCent: number;
  ermaessigungCent: number;
  mitgliedRabattCent: number;
  gesamtCent: number;
};

export type PreisParams = {
  sportart: string;
  saison: "winter" | "sommer";
  wochentag: "werktags" | "wochenende";
  mitglied: boolean;
  slots: string[]; // belegte 15-Min-Slots
  dauerMinuten: number;
  leihschlaegerAnzahl: number;
  baelle: boolean;
  ermaessigung: boolean;
};

// Findet den Tarif für einen konkreten Slot.
function tarifFuerSlot(
  tarife: TarifZeile[],
  p: { sportart: string; saison: string; mitglied: boolean; wochentag: string; slot: string }
): TarifZeile | undefined {
  const m = zeitTomin(p.slot);
  return tarife.find(
    (t) =>
      t.sportart === p.sportart &&
      t.saison === p.saison &&
      t.mitglied === p.mitglied &&
      t.wochentagGruppe === p.wochentag &&
      zeitTomin(t.zeitVon) <= m &&
      m < zeitTomin(t.zeitBis)
  );
}

// Reine Preisberechnung (ohne DB) – gut testbar.
export function berechnePreis(params: PreisParams, tarife: TarifZeile[]): PreisAufschluesselung {
  let platzCent = 0;
  let ermaessigungCent = 0;
  let mitgliedRabattCent = 0;

  for (const slot of params.slots) {
    const tarif = tarifFuerSlot(tarife, {
      sportart: params.sportart,
      saison: params.saison,
      mitglied: params.mitglied,
      wochentag: params.wochentag,
      slot,
    });
    if (!tarif) {
      throw new Error(
        `Kein Tarif gefunden für ${params.sportart}/${params.saison}/` +
          `${params.mitglied ? "mitglied" : "gast"}/${params.wochentag} um ${slot}.`
      );
    }
    // Preis pro 15-Min-Slot = Stundenpreis / 4.
    platzCent += Math.round(tarif.preisProStundeCent / (60 / SLOT_MINUTEN));

    // Mitglieder-Rabatt: fester Nachlass pro Stunde (anteilig je Slot).
    if (params.mitglied) {
      mitgliedRabattCent += Math.round(
        config.mitgliedRabattCentProStunde / (60 / SLOT_MINUTEN)
      );
    }

    // Ermäßigung (Schüler/Studenten): werktags bis 17 Uhr sowie Sa/So.
    if (params.ermaessigung) {
      const qualifiziert =
        params.wochentag === "wochenende" || zeitTomin(slot) < zeitTomin("17:00");
      if (qualifiziert) {
        ermaessigungCent += Math.round(
          config.ermaessigungCentProStunde / (60 / SLOT_MINUTEN)
        );
      }
    }
  }

  const stunden = params.dauerMinuten / 60;
  const leihschlaegerCent = Math.round(
    config.leihschlaegerCentProStunde * params.leihschlaegerAnzahl * stunden
  );
  const ballCent = params.baelle ? config.ballPreisCent : 0;

  // Rabatte dürfen den Platzpreis nicht ins Negative ziehen.
  const effektiveErmaessigung = Math.min(ermaessigungCent, platzCent);
  const effektiverMitgliedRabatt = Math.min(
    mitgliedRabattCent,
    platzCent - effektiveErmaessigung
  );

  const gesamtCent =
    platzCent +
    leihschlaegerCent +
    ballCent -
    effektiveErmaessigung -
    effektiverMitgliedRabatt;

  return {
    platzCent,
    leihschlaegerCent,
    ballCent,
    ermaessigungCent: effektiveErmaessigung,
    mitgliedRabattCent: effektiverMitgliedRabatt,
    gesamtCent: Math.max(0, gesamtCent),
  };
}

// Preisberechnung mit Daten aus der DB.
export async function berechnePreisFuerBuchung(input: {
  platzId: number;
  datum: string;
  startzeit: string;
  dauerMinuten: number;
  mitglied: boolean;
  leihschlaegerAnzahl: number;
  baelle: boolean;
  ermaessigung: boolean;
}): Promise<PreisAufschluesselung> {
  const platz = await prisma.platz.findUnique({ where: { id: input.platzId } });
  if (!platz) throw new Error("Platz nicht gefunden.");

  const saison = saisonFuerDatum(input.datum);
  const wochentag = wochentagGruppe(input.datum);

  const tarife = await prisma.tarif.findMany({
    where: { sportart: platz.typ, saison, mitglied: input.mitglied, wochentagGruppe: wochentag },
  });

  const slots = slotsFuerBuchung(input.startzeit, input.dauerMinuten);

  return berechnePreis(
    {
      sportart: platz.typ,
      saison,
      wochentag,
      mitglied: input.mitglied,
      slots,
      dauerMinuten: input.dauerMinuten,
      leihschlaegerAnzahl: input.leihschlaegerAnzahl,
      baelle: input.baelle,
      ermaessigung: input.ermaessigung,
    },
    tarife
  );
}

// Cent -> "12,50" (ohne Euro-Zeichen).
export function formatEuro(cent: number): string {
  return (cent / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
