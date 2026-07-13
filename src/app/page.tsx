import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { heuteISO, datumPlusTage } from "@/lib/time";
import { smsAktiv } from "@/lib/sms";
import BuchungsApp from "@/components/BuchungsApp";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const plaetze = await prisma.platz.findMany({
    where: { aktiv: true },
    orderBy: { id: "asc" },
    select: { id: true, name: true, typ: true },
  });

  const settings = {
    minDauer: config.minDauerMinuten,
    maxDauer: config.maxDauerMinuten,
    codeGueltigMinuten: config.codeGueltigMinuten,
    leihschlaegerCentProStunde: config.leihschlaegerCentProStunde,
    ballPreisCent: config.ballPreisCent,
    smsAktiv: smsAktiv(),
    heute: heuteISO(),
    maxDatum: datumPlusTage(config.buchungHorizontTage),
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-verein-blau">Platz buchen</h1>
      <p className="mb-4 text-sm text-gray-600">
        Tennis &amp; Squash in der Halle. Bezahlung erfolgt vor Ort.
      </p>
      <a
        href="/kalender"
        className="mb-6 inline-block rounded-full border border-verein-blau px-4 py-2 text-sm font-medium text-verein-blau"
      >
        Wochenübersicht ansehen
      </a>
      <BuchungsApp plaetze={plaetze} settings={settings} />
    </div>
  );
}
