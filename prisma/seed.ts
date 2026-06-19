import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Buchbare Flaechen
// ---------------------------------------------------------------------------
const PLAETZE = [
  { name: "Tennisplatz 1", typ: "tennis" },
  { name: "Tennisplatz 2", typ: "tennis" },
  { name: "Squash", typ: "squash" },
];

// ---------------------------------------------------------------------------
// Tarif-Startwerte (Quelle: offizielle Preisliste Wintersaison 2025/2026, PDF)
//
// Es gelten ausschliesslich die "Einzelstunde"-Preise (Abo / 10er-Abo werden
// bewusst NICHT abgebildet). Die Einzelstunde kennt KEINE Trennung nach
// Mitglied/Gast -> Mitglied- und Gastpreis werden identisch gesetzt.
//
// Werktags (Mo-Fr) gelten zeitabhaengige Fenster, am Wochenende (Sa/So) ein
// pauschaler Preis ueber den ganzen Tag.
//
// Zeitfenster decken die gesamte Oeffnungszeit 07:00-23:00 ab (lueckenlos).
// Das erste Fenster wurde von 08:00 auf 07:00 vorgezogen, die Halle ist ab
// 07:00 buchbar (PDF nennt 08:00 als ersten Tarif). Bitte pruefen.
//
// Sommer-Hallenpreise sind in der PDF nicht ausgewiesen; als Platzhalter
// werden die Winterwerte uebernommen und koennen im Admin-Bereich angepasst
// werden. Es werden keine Preise frei erfunden.
// ---------------------------------------------------------------------------

// Preise pro Stunde in Cent, je Sportart und Zeitfenster.
const TENNIS_WERKTAGS = [
  { von: "07:00", bis: "14:00", cent: 1900 }, // 19 EUR
  { von: "14:00", bis: "18:00", cent: 2100 }, // 21 EUR
  { von: "18:00", bis: "21:00", cent: 2400 }, // 24 EUR
  { von: "21:00", bis: "23:00", cent: 1900 }, // 19 EUR
];
const TENNIS_WOCHENENDE = [
  { von: "07:00", bis: "23:00", cent: 1900 }, // pauschal 19 EUR
];

const SQUASH_WERKTAGS = [
  { von: "07:00", bis: "14:00", cent: 1300 }, // 13 EUR
  { von: "14:00", bis: "18:00", cent: 1300 }, // 13 EUR
  { von: "18:00", bis: "21:00", cent: 1500 }, // 15 EUR
  { von: "21:00", bis: "23:00", cent: 1300 }, // 13 EUR
];
const SQUASH_WOCHENENDE = [
  { von: "07:00", bis: "23:00", cent: 1300 }, // pauschal 13 EUR
];

const FENSTER: Record<string, Record<string, { von: string; bis: string; cent: number }[]>> = {
  tennis: { werktags: TENNIS_WERKTAGS, wochenende: TENNIS_WOCHENENDE },
  squash: { werktags: SQUASH_WERKTAGS, wochenende: SQUASH_WOCHENENDE },
};

const SAISONS = ["winter", "sommer"] as const;
const MITGLIED = [true, false]; // Einzelstunde: Mitglied = Gast (identische Preise)
const WOCHENTAG = ["werktags", "wochenende"] as const;

async function seedTarife() {
  const rows: {
    sportart: string;
    saison: string;
    mitglied: boolean;
    wochentagGruppe: string;
    zeitVon: string;
    zeitBis: string;
    preisProStundeCent: number;
  }[] = [];

  for (const sportart of ["tennis", "squash"]) {
    for (const saison of SAISONS) {
      for (const mitglied of MITGLIED) {
        for (const wochentagGruppe of WOCHENTAG) {
          for (const f of FENSTER[sportart][wochentagGruppe]) {
            rows.push({
              sportart,
              saison,
              mitglied,
              wochentagGruppe,
              zeitVon: f.von,
              zeitBis: f.bis,
              preisProStundeCent: f.cent,
            });
          }
        }
      }
    }
  }

  await prisma.tarif.createMany({ data: rows });
  return rows.length;
}

// ---------------------------------------------------------------------------
// Zugangscodes (Tuercode der Halle je Wochentag). Sa+So teilen sich einen Code.
// Werte vom Verein vorgegeben.
// ---------------------------------------------------------------------------
const ZUGANGSCODES: { wochentag: string; code: string }[] = [
  { wochentag: "montag", code: "180371" },
  { wochentag: "dienstag", code: "507452" },
  { wochentag: "mittwoch", code: "671543" },
  { wochentag: "donnerstag", code: "962184" },
  { wochentag: "freitag", code: "439275" },
  { wochentag: "samstag", code: "283416" },
  { wochentag: "sonntag", code: "283416" },
];

async function seedZugangscodes() {
  // Alten "wochenende"-Eintrag entfernen, falls noch vorhanden.
  await prisma.zugangscode.deleteMany({ where: { wochentag: "wochenende" } });
  for (const z of ZUGANGSCODES) {
    await prisma.zugangscode.upsert({
      where: { wochentag: z.wochentag },
      update: { code: z.code },
      create: z,
    });
  }
  return ZUGANGSCODES.length;
}

async function main() {
  // Plaetze
  const vorhandene = await prisma.platz.count();
  if (vorhandene === 0) {
    for (const p of PLAETZE) {
      await prisma.platz.create({ data: p });
    }
    console.log(`Plaetze angelegt: ${PLAETZE.length}`);
  } else {
    console.log(`Plaetze bereits vorhanden (${vorhandene}), uebersprungen.`);
  }

  // Tarife: immer neu setzen, damit die offiziellen Preise (PDF) uebernommen
  // werden, auch wenn frueher bereits aeltere Werte geseedet wurden.
  const tarifeVorhanden = await prisma.tarif.count();
  await prisma.tarif.deleteMany();
  const n = await seedTarife();
  console.log(`Tarif-Zeilen gesetzt: ${n} (vorher ${tarifeVorhanden} entfernt).`);

  // Zugangscodes (Tuercode je Wochentag)
  const zc = await seedZugangscodes();
  console.log(`Zugangscodes gesetzt: ${zc}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
