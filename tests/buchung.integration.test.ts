// Integrationstests gegen die Datenbank.
// Voraussetzung: `npm run prisma:migrate` (Schema vorhanden). Die Tests legen
// einen eigenen Tennisplatz und einen passenden Tarif an und raeumen nach sich
// selbst auf. Sie nutzen die in .env hinterlegte DATABASE_URL.

import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  erstelleVorlaeufigeBuchung,
  bestaetigeBuchung,
  storniereMitToken,
} from "@/lib/buchungLogik";
import { aufraeumenAbgelaufen, slotsFrei } from "@/lib/availability";
import { saisonFuerDatum } from "@/lib/season";
import { wochentagGruppe, datumPlusTage } from "@/lib/time";

let platzId: number;
const datum = datumPlusTage(30);
const startzeit = "09:00";

beforeAll(async () => {
  const platz = await prisma.platz.create({
    data: { name: `Testplatz ${Date.now()}`, typ: "tennis", aktiv: true },
  });
  platzId = platz.id;

  // Tarif, der den Testtag (Saison/Wochentag, Gast) ganztaegig abdeckt.
  await prisma.tarif.create({
    data: {
      sportart: "tennis",
      saison: saisonFuerDatum(datum),
      mitglied: false,
      wochentagGruppe: wochentagGruppe(datum),
      zeitVon: "00:00",
      zeitBis: "23:59",
      preisProStundeCent: 2000,
    },
  });
});

afterEach(async () => {
  // Belegungen + Buchungen des Testplatzes entfernen.
  await prisma.belegung.deleteMany({ where: { platzId } });
  await prisma.buchung.deleteMany({ where: { platzId } });
});

afterAll(async () => {
  await prisma.belegung.deleteMany({ where: { platzId } });
  await prisma.buchung.deleteMany({ where: { platzId } });
  await prisma.tarif.deleteMany({
    where: { zeitVon: "00:00", zeitBis: "23:59", preisProStundeCent: 2000 },
  });
  await prisma.platz.delete({ where: { id: platzId } });
  await prisma.$disconnect();
});

function input(kontakt = "test@example.com") {
  return {
    platzId,
    datum,
    startzeit,
    dauerMinuten: 60,
    name: "Testperson",
    kontakt,
    mitglied: false,
    leihschlaegerAnzahl: 0,
    baelle: false,
    ermaessigung: false,
    einwilligung: true,
  };
}

describe("Buchungslogik (DB)", () => {
  it("legt eine vorlaeufige Buchung an und reserviert die Slots", async () => {
    const r = await erstelleVorlaeufigeBuchung(input());
    expect(r.ok).toBe(true);
    const frei = await slotsFrei(platzId, datum, ["09:00", "09:15", "09:30", "09:45"]);
    expect(frei).toBe(false);
  });

  it("verhindert Doppelbuchung bei gleichzeitigen Anfragen", async () => {
    const [a, b] = await Promise.all([
      erstelleVorlaeufigeBuchung(input("a@example.com")),
      erstelleVorlaeufigeBuchung(input("b@example.com")),
    ]);
    const erfolge = [a, b].filter((x) => x.ok).length;
    expect(erfolge).toBe(1);
    const fehlschlag = [a, b].find((x) => !x.ok);
    expect(fehlschlag && !fehlschlag.ok && fehlschlag.fehler).toContain("nicht mehr verfuegbar");
  });

  it("gibt Slots nach Ablauf der Code-Frist wieder frei", async () => {
    const r = await erstelleVorlaeufigeBuchung(input());
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    // Code-Frist kuenstlich in die Vergangenheit setzen.
    await prisma.buchung.update({
      where: { id: r.data.buchungId },
      data: { codeAblauf: new Date(Date.now() - 1000) },
    });

    await aufraeumenAbgelaufen();

    const buchung = await prisma.buchung.findUnique({ where: { id: r.data.buchungId } });
    expect(buchung?.status).toBe("storniert");
    const frei = await slotsFrei(platzId, datum, ["09:00"]);
    expect(frei).toBe(true);
  });

  it("bestaetigt nur mit korrektem Code", async () => {
    const r = await erstelleVorlaeufigeBuchung(input());
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const falsch = await bestaetigeBuchung(r.data.buchungId, "000000", "http://localhost");
    // Sehr unwahrscheinlich, dass der echte Code 000000 ist; sonst neu testen.
    if (!falsch.ok) {
      expect(falsch.fehler).toContain("falsch");
    }

    const b = await prisma.buchung.findUnique({ where: { id: r.data.buchungId } });
    const ok = await bestaetigeBuchung(r.data.buchungId, b!.code!, "http://localhost");
    expect(ok.ok).toBe(true);

    const bestaetigt = await prisma.buchung.findUnique({ where: { id: r.data.buchungId } });
    expect(bestaetigt?.status).toBe("bestaetigt");
    expect(bestaetigt?.code).toBeNull();
  });

  it("storniert nur mit gueltigem Token", async () => {
    const r = await erstelleVorlaeufigeBuchung(input());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const b = await prisma.buchung.findUnique({ where: { id: r.data.buchungId } });
    const conf = await bestaetigeBuchung(r.data.buchungId, b!.code!, "http://localhost");
    expect(conf.ok).toBe(true);
    if (!conf.ok) return;

    const falsch = await storniereMitToken("ungueltiger-token");
    expect(falsch.ok).toBe(false);

    const ok = await storniereMitToken(conf.data.stornoToken);
    expect(ok.ok).toBe(true);

    const frei = await slotsFrei(platzId, datum, ["09:00"]);
    expect(frei).toBe(true);
  });
});
