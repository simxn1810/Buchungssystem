import { prisma } from "./prisma";
import { wochentagKey } from "./time";

// Liefert den Tuer-/Zugangscode der Halle fuer ein Buchungsdatum
// (passend zum Wochentag) oder null, wenn keiner hinterlegt ist.
export async function zugangscodeFuerDatum(datum: string): Promise<string | null> {
  const eintrag = await prisma.zugangscode.findUnique({
    where: { wochentag: wochentagKey(datum) },
  });
  return eintrag?.code ?? null;
}
