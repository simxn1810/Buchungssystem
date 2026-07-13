import Link from "next/link";
import { VEREIN } from "@/lib/config";

export const metadata = { title: "Preise – TC Frankenau" };

// Preise exakt gemäß offizieller Vereins-Preisliste (PDF). Ganze Euro-Beträge.
const eur = (n: number) => `${n},- €`;

type WinterRow = {
  label: string;
  tennis: [number, number | null, number]; // Abo, 10er-Abo, Einzelstunde
  squash: [number, number]; // Abo, Einzelstunde
};

// Wintersaison 2025/2026 (01. Oktober 2025 bis 30. April 2026)
const WINTER: WinterRow[] = [
  { label: "08:00 – 14:00", tennis: [17, 18, 19], squash: [11, 13] },
  { label: "14:00 – 18:00", tennis: [19, 20, 21], squash: [11, 13] },
  { label: "18:00 – 21:00", tennis: [22, null, 24], squash: [13, 15] },
  { label: "21:00 – 00:00", tennis: [17, 18, 19], squash: [11, 13] },
  { label: "Samstag & Sonntag", tennis: [17, 18, 19], squash: [11, 13] },
];

// Sommersaison 2026: Einheitspreis über alle Zeiten und Abo-Arten
const SOMMER_ROWS = ["08:00 – 14:00", "14:00 – 18:00", "18:00 – 21:00", "21:00 – 00:00", "Samstag & Sonntag"];
const SOMMER_TENNIS = 12;
const SOMMER_SQUASH = 10;

const th = "border border-gray-300 p-2 text-center align-middle";
const td = "border border-gray-300 p-2 text-center align-middle";
const tdLabel = "border border-gray-300 p-2 text-center align-middle font-semibold text-verein-blau whitespace-nowrap";

export default function PreisePage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-verein-blau">Preise</h1>
      <p className="mb-6 text-sm text-gray-600">
        Alle Preise gelten pro Platz und Stunde. Abgerechnet wird in 15-Minuten-Schritten, d. h. der
        angezeigte Stundenpreis wird anteilig berechnet. Die Bezahlung erfolgt vor Ort.
      </p>

      {/* Wintersaison */}
      <section className="mb-8">
        <h2 className="mb-1 text-xl font-semibold text-verein-blau">Preisliste Wintersaison 2025/2026</h2>
        <p className="mb-3 text-sm text-gray-600">vom 01. Oktober 2025 bis 30. April 2026</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={`${th} bg-verein-blau text-white`} rowSpan={2}>
                  werktags
                </th>
                <th className={`${th} bg-verein-blau text-white`} colSpan={3}>
                  Tennis (Platz/Stunde)
                </th>
                <th className={`${th} bg-verein-blau text-white`} colSpan={2}>
                  Squash
                </th>
              </tr>
              <tr>
                <th className={`${th} bg-gray-100`}>Abo</th>
                <th className={`${th} bg-gray-100`}>10er-Abo</th>
                <th className={`${th} bg-gray-100`}>Einzelstunde</th>
                <th className={`${th} bg-gray-100`}>Abo</th>
                <th className={`${th} bg-gray-100`}>Einzelstunde</th>
              </tr>
            </thead>
            <tbody>
              {WINTER.map((r) => (
                <tr key={r.label}>
                  <td className={tdLabel}>{r.label}</td>
                  <td className={td}>{eur(r.tennis[0])}</td>
                  <td className={td}>{r.tennis[1] === null ? "–" : eur(r.tennis[1])}</td>
                  <td className={td}>{eur(r.tennis[2])}</td>
                  <td className={td}>{eur(r.squash[0])}</td>
                  <td className={td}>{eur(r.squash[1])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sommersaison */}
      <section className="mb-8">
        <h2 className="mb-1 text-xl font-semibold text-verein-blau">Preisliste Sommersaison 2026</h2>
        <p className="mb-3 text-sm text-gray-600">vom 01. Mai 2026 bis 30. September 2026</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={`${th} bg-verein-blau text-white`} rowSpan={2}>
                  werktags
                </th>
                <th className={`${th} bg-verein-blau text-white`} colSpan={3}>
                  Tennis (Platz/Stunde)
                </th>
                <th className={`${th} bg-verein-blau text-white`} colSpan={2}>
                  Squash
                </th>
              </tr>
              <tr>
                <th className={`${th} bg-gray-100`}>Abo</th>
                <th className={`${th} bg-gray-100`}>10er-Abo</th>
                <th className={`${th} bg-gray-100`}>Einzelstunde</th>
                <th className={`${th} bg-gray-100`}>Abo</th>
                <th className={`${th} bg-gray-100`}>Einzelstunde</th>
              </tr>
            </thead>
            <tbody>
              {SOMMER_ROWS.map((label, i) => (
                <tr key={label}>
                  <td className={tdLabel}>{label}</td>
                  {i === 0 && (
                    <td className={`${td} text-2xl font-bold`} colSpan={3} rowSpan={SOMMER_ROWS.length}>
                      {eur(SOMMER_TENNIS)}
                    </td>
                  )}
                  {i === 0 && (
                    <td className={`${td} text-2xl font-bold`} colSpan={2} rowSpan={SOMMER_ROWS.length}>
                      {eur(SOMMER_SQUASH)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Anmerkungen unter den Listen */}
      <section className="mb-8 rounded-lg border border-gray-200 p-4 text-sm">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Schüler und Studenten:</strong> 2,- € Ermäßigung pro Stunde. Nachweis vor Ort.
          </li>
          <li>
            <strong>Schlägerleihe:</strong> 1,- € pro Stunde und Schläger.
          </li>
        </ul>
      </section>

      <p className="mb-6 text-xs text-gray-500">
        Maßgeblich ist die offizielle Preisliste des Vereins. Bei Fragen:{" "}
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
