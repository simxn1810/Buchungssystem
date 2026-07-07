import { config } from "@/lib/config";
import { heuteISO, datumPlusTage } from "@/lib/time";
import KalenderApp from "@/components/KalenderApp";

export const dynamic = "force-dynamic";

export default function KalenderPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-verein-blau">Wochen&uuml;bersicht</h1>
      <p className="mb-6 text-sm text-gray-600">
        Auf einen Blick sehen, wann welche Pl&auml;tze frei sind. Zum Buchen zur&uuml;ck zur{" "}
        <a href="/" className="text-verein-blau underline">
          Buchungsseite
        </a>
        .
      </p>
      <KalenderApp heute={heuteISO()} maxDatum={datumPlusTage(config.buchungHorizontTage)} />
    </div>
  );
}
