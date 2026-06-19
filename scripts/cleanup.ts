// DSGVO-Aufraeumung: loescht Buchungsdaten, die aelter als DATEN_LOESCH_TAGE
// sind. Per Cron/Scheduler ausfuehren: `npm run cleanup`.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tage = Number(process.env.DATEN_LOESCH_TAGE || 60);
  const grenze = new Date(Date.now() - tage * 24 * 60 * 60 * 1000);

  // Belegungen werden via onDelete: Cascade mitgeloescht.
  const result = await prisma.buchung.deleteMany({
    where: { erstelltAm: { lt: grenze } },
  });
  console.log(`Geloeschte Buchungen (aelter als ${tage} Tage): ${result.count}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
