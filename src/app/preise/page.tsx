import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { config, VEREIN } from "@/lib/config";
import { formatEuro } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preise – TC Frankenau" };

const SPORT_LABEL: Record<string, string> = { tennis: "Tennis", squash: "Squash" };
const SAISON_LABEL: Record<string, string> = {
  winter: "Wintersaison (01.10.–30.04.)",
  sommer: "Sommersaison (01.05.–30.09.)",
};

export default async function PreisePage() {
  // Einzelstunde: keine Mitglied/Gast-Trennung -> wir lesen nur die
  // Mitglied-Zeilen (identisch zu Gast).
  const tarife = await prisma.tarif.findMany({
    where: { mitglied: true },
    orderBy: [{ sportart: "asc" }, { saison: "asc" }, { zeitVon: "asc" }],
  });

  // Struktur: sportart -> saison -> { werktags: Fenster[], wochenendeCent: number|null }
  type Fenster = { von: string; bis: string; cent: number };
  type Saison = { werktags: Fenster[]; wochenendeCent: number | null };
  const struktur: Record<string, Record<string, Saison>> = {};

  for (const t of tarife) {
    const sp = (struktur[t.sportart] ??= {});
    const sa = (sp[t.saison] ??= { werktags: [], wochenendeCent: null });
    if (t.wochentagGruppe === "wochenende") {
      sa.wochenendeCent = t.preisProStundeCent;
    } else {
      sa.werktags.push({ von: t.zeitVon, bis: t.zeitBis, cent: t.preisProStundeCent });
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-verein-blau">Preise</h1>
      <p className="mb-6 text-sm text-gray-600">
        Alle Preise gelten pro Platz und Stunde (Einzelstunde). Abgerechnet wird in
        15-Minuten-Schritten, d. h. der angezeigte Stundenpreis wird anteilig berechnet. Die
        Bezahlung erfolgt vor Ort.
      </p>

      {Object.keys(struktur)
        .sort()
        .map((sportart) => (
          <section key={sportart} className="mb-8">
            <h2 className="mb-3 text-xl font-semibold text-verein-blau">
              {SPORT_LABEL[sportart] ?? sportart}
            </h2>
            {Object.keys(struktur[sportart])
              .sort()
              .map((saison) => {
                const s = struktur[sportart][saison];
                const fenster = [...s.werktags].sort((a, b) => a.von.localeCompare(b.von));
                return (
                  <div key={saison} className="mb-5">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      {SAISON_LABEL[saison] ?? saison}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-verein-blau text-left text-white">
                            <th className="p-2">Uhrzeit (Mo–Fr)</th>
                            <th className="p-2">Preis / Stunde</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fenster.map((f) => (
                            <tr key={`${f.von}-${f.bis}`} className="border-b border-gray-200">
                              <td className="p-2 font-medium">
                                {f.von}–{f.bis}
                              </td>
                              <td className="p-2">{formatEuro(f.cent)} €</td>
                            </tr>
                          ))}
                          {s.wochenendeCent !== null && (
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <td className="p-2 font-medium">Sa &amp; So (ganztägig)</td>
                              <td className="p-2">{formatEuro(s.wochenendeCent)} €</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </section>
        ))}

      <section className="mb-8 rounded-lg border border-gray-200 p-4 text-sm">
        <h2 className="mb-2 text-lg font-semibold text-verein-blau">Rabatte &amp; Zuschläge</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Ermäßigung Schüler/Studenten:</strong> {formatEuro(config.ermaessigungCentProStunde)} € pro
            Stunde Abzug, werktags bis 17 Uhr sowie samstags und sonntags. Nachweis vor Ort.
          </li>
          <li>
            <strong>Leihschläger:</strong> {formatEuro(config.leihschlaegerCentProStunde)} € pro Schläger und
            Stunde (anteilig zur gebuchten Dauer).
          </li>
          <li>
            <strong>Bälle:</strong>{" "}
            {config.ballPreisCent === 0
              ? "inklusive (kein Aufpreis)"
              : `${formatEuro(config.ballPreisCent)} € pro Buchung`}
            .
          </li>
          <li>
            <strong>Zuschläge zu Hauptzeiten</strong> sind bereits in den oben genannten
            Stundenpreisen (höhere Preise in den Abendfenstern) enthalten.
          </li>
        </ul>
      </section>

      <p className="mb-6 text-xs text-gray-500">
        Maßgeblich ist die offizielle Preisliste des Vereins (Einzelstunde). Bei Fragen:{" "}
        <a className="text-verein-blau underline" href={`mailto:${VEREIN.email}`}>
          {VEREIN.email}
        </a>
        .
      </p>

      <Link
        href="/"
        className="inline-block rounded bg-verein-blau px-4 py-2 font-semibold text-white"
      >
        Zur Buchung
      </Link>
    </div>
  );
}
