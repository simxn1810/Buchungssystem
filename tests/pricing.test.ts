import { describe, it, expect } from "vitest";
import { berechnePreis, type TarifZeile } from "@/lib/pricing";
import { slotsFuerBuchung } from "@/lib/time";

// Beispiel-Tarife: Tennis, Winter, Gast, werktags.
const tarife: TarifZeile[] = [
  { sportart: "tennis", saison: "winter", mitglied: false, wochentagGruppe: "werktags", zeitVon: "07:00", zeitBis: "14:00", preisProStundeCent: 1900 },
  { sportart: "tennis", saison: "winter", mitglied: false, wochentagGruppe: "werktags", zeitVon: "14:00", zeitBis: "18:00", preisProStundeCent: 2100 },
  { sportart: "tennis", saison: "winter", mitglied: false, wochentagGruppe: "werktags", zeitVon: "18:00", zeitBis: "21:00", preisProStundeCent: 2400 },
  { sportart: "tennis", saison: "winter", mitglied: false, wochentagGruppe: "werktags", zeitVon: "21:00", zeitBis: "23:00", preisProStundeCent: 1900 },
  // Mitglied = Gast (identische Preise), damit der Tarif-Lookup fuer Mitglieder greift.
  { sportart: "tennis", saison: "winter", mitglied: true, wochentagGruppe: "werktags", zeitVon: "07:00", zeitBis: "14:00", preisProStundeCent: 1900 },
  { sportart: "tennis", saison: "winter", mitglied: true, wochentagGruppe: "werktags", zeitVon: "14:00", zeitBis: "18:00", preisProStundeCent: 2100 },
  { sportart: "tennis", saison: "winter", mitglied: true, wochentagGruppe: "werktags", zeitVon: "18:00", zeitBis: "21:00", preisProStundeCent: 2400 },
  { sportart: "tennis", saison: "winter", mitglied: true, wochentagGruppe: "werktags", zeitVon: "21:00", zeitBis: "23:00", preisProStundeCent: 1900 },
];

function basis(slotsStart: string, dauer: number) {
  return {
    sportart: "tennis",
    saison: "winter" as const,
    wochentag: "werktags" as const,
    mitglied: false,
    slots: slotsFuerBuchung(slotsStart, dauer),
    dauerMinuten: dauer,
    leihschlaegerAnzahl: 0,
    baelle: false,
    ermaessigung: false,
  };
}

describe("Preisberechnung", () => {
  it("Platzpreis = Stundenpreis / 4 je 15 Min", () => {
    // 60 Min im 24-EUR-Fenster -> 24,00 EUR.
    const p = berechnePreis(basis("18:00", 60), tarife);
    expect(p.platzCent).toBe(2400);
    expect(p.gesamtCent).toBe(2400);
  });

  it("rechnet ueber mehrere Zeitfenster anteilig", () => {
    // 17:45-18:15: 17:45 (2100/4=525) + 18:00 (2400/4=600) = 1125.
    const p = berechnePreis(basis("17:45", 30), tarife);
    expect(p.platzCent).toBe(1125);
  });

  it("addiert Leihschlaeger (1 EUR x Anzahl x Stunden)", () => {
    // 90 Min, 2 Schlaeger = 3,00 EUR.
    const p = berechnePreis(
      { ...basis("18:00", 90), leihschlaegerAnzahl: 2 },
      tarife
    );
    expect(p.leihschlaegerCent).toBe(300);
    // Platz: 6 Slots * 600 = 3600 + 300 = 3900.
    expect(p.gesamtCent).toBe(3900);
  });

  it("zieht Ermaessigung werktags vor 17 Uhr ab", () => {
    // 13:00-14:00, Ermaessigung aktiv: Platz 4*475=1900, Abzug 4*50=200.
    const p = berechnePreis(
      { ...basis("13:00", 60), ermaessigung: true },
      tarife
    );
    expect(p.platzCent).toBe(1900);
    expect(p.ermaessigungCent).toBe(200);
    expect(p.gesamtCent).toBe(1700);
  });

  it("gewaehrt werktags nach 17 Uhr keine Ermaessigung", () => {
    const p = berechnePreis(
      { ...basis("18:00", 60), ermaessigung: true },
      tarife
    );
    expect(p.ermaessigungCent).toBe(0);
    expect(p.gesamtCent).toBe(2400);
  });

  it("zieht Mitglieder-Rabatt von 2 EUR pro Stunde ab", () => {
    // 18:00-19:00 als Mitglied: Platz 2400, Rabatt 4*50=200 -> 2200.
    const p = berechnePreis({ ...basis("18:00", 60), mitglied: true }, tarife);
    expect(p.platzCent).toBe(2400);
    expect(p.mitgliedRabattCent).toBe(200);
    expect(p.gesamtCent).toBe(2200);
  });

  it("wirft einen Fehler, wenn kein Tarif passt", () => {
    expect(() => berechnePreis(basis("06:00", 30), tarife)).toThrow();
  });
});
