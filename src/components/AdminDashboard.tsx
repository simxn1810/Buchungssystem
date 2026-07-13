"use client";

import { useEffect, useMemo, useState } from "react";

type Zeile = {
  label: string;
  umsatzCent: number;
  stundenTennis: number;
  stundenSquash: number;
  buchungenAnzahl: number;
};
type Antwort = {
  jahre: number[];
  jahr: number;
  monat: number | null;
  reihen: Zeile[];
  summe: { umsatzCent: number; stundenTennis: number; stundenSquash: number; buchungenAnzahl: number };
};

// Validierte kategoriale Farben (siehe dataviz-Skill): Slot 1 (Blau) und
// Slot 3 (Amber) – CVD-sicher unterscheidbar, WCAG-Kontrast-Warnung bei Amber
// wird durch Legende + Tooltip + Tabellenansicht abgefangen (Relief-Regel).
const FARBE_TENNIS = "#2a78d6";
const FARBE_SQUASH = "#eda100";
const FARBE_UMSATZ = "#2a78d6";

const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function euro(cent: number) {
  return (cent / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function stunden(h: number) {
  return h.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// Rundet die obere Grenze auf eine "runde" Zahl für Gitterlinien (0/1/2/5 * 10^n).
function niceMax(max: number): number {
  if (max <= 0) return 1;
  const exp = Math.floor(Math.log10(max));
  const basis = max / Math.pow(10, exp);
  let stufe: number;
  if (basis <= 1) stufe = 1;
  else if (basis <= 2) stufe = 2;
  else if (basis <= 5) stufe = 5;
  else stufe = 10;
  return stufe * Math.pow(10, exp);
}

function ticks(max: number, anzahl = 4): number[] {
  const top = niceMax(max);
  const arr: number[] = [];
  for (let i = 0; i <= anzahl; i++) arr.push(Math.round((top / anzahl) * i));
  return arr;
}

export default function AdminDashboard() {
  const jetzt = new Date();
  const [ansicht, setAnsicht] = useState<"jahr" | "monat">("jahr");
  const [jahr, setJahr] = useState(jetzt.getFullYear());
  const [monat, setMonat] = useState(jetzt.getMonth() + 1);
  const [daten, setDaten] = useState<Antwort | null>(null);
  const [lade, setLade] = useState(true);
  const [tabelle, setTabelle] = useState(false);

  useEffect(() => {
    setLade(true);
    const params = new URLSearchParams({ jahr: String(jahr) });
    if (ansicht === "monat") params.set("monat", String(monat));
    fetch(`/api/admin/statistik?${params.toString()}`)
      .then((r) => r.json())
      .then((json: Antwort) => setDaten(json))
      .finally(() => setLade(false));
  }, [jahr, ansicht, monat]);

  const jahre = daten?.jahre ?? [jetzt.getFullYear()];
  const reihen = daten?.reihen ?? [];

  return (
    <div>
      {/* Filterzeile – eine Reihe oberhalb der Charts, scoped alles darunter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-full border border-gray-300">
          <button
            onClick={() => setAnsicht("jahr")}
            className={`px-3 py-1.5 text-sm font-medium ${
              ansicht === "jahr" ? "bg-verein-blau text-white" : "bg-white text-gray-700"
            }`}
          >
            Jahresansicht
          </button>
          <button
            onClick={() => setAnsicht("monat")}
            className={`px-3 py-1.5 text-sm font-medium ${
              ansicht === "monat" ? "bg-verein-blau text-white" : "bg-white text-gray-700"
            }`}
          >
            Monatsansicht
          </button>
        </div>
        <select
          value={jahr}
          onChange={(e) => setJahr(Number(e.target.value))}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm"
        >
          {jahre.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
        {ansicht === "monat" && (
          <select
            value={monat}
            onChange={(e) => setMonat(Number(e.target.value))}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            {MONATE.map((label, i) => (
              <option key={label} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
        )}
      </div>

      {lade || !daten ? (
        <p className="py-8 text-center text-gray-500">Lade Auswertung…</p>
      ) : (
        <div style={{ opacity: lade ? 0.5 : 1 }}>
          {/* Stat-Kacheln */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatKachel
              label="Umsatz laut Portal (nur bestätigte Buchungen)"
              wert={`${euro(daten.summe.umsatzCent)} €`}
              hervorgehoben
            />
            <StatKachel
              label="Belegungsstunden gesamt"
              wert={`${stunden(daten.summe.stundenTennis + daten.summe.stundenSquash)} h`}
            />
            <StatKachel label="Anzahl Buchungen" wert={String(daten.summe.buchungenAnzahl)} />
          </div>

          <ChartCard titel="Belegungsstunden" untertitel={ansicht === "jahr" ? `Jahr ${jahr}` : `${MONATE[monat - 1]} ${jahr}`}>
            <Legende items={[{ farbe: FARBE_TENNIS, label: "Tennis" }, { farbe: FARBE_SQUASH, label: "Squash" }]} />
            <GruppierteBalken
              reihen={reihen}
              seriesA={{ key: "stundenTennis", farbe: FARBE_TENNIS, label: "Tennis" }}
              seriesB={{ key: "stundenSquash", farbe: FARBE_SQUASH, label: "Squash" }}
              formatWert={(v) => `${stunden(v)} h`}
              formatTick={(v) => `${v} h`}
            />
          </ChartCard>

          <ChartCard titel="Umsatz" untertitel={ansicht === "jahr" ? `Jahr ${jahr}` : `${MONATE[monat - 1]} ${jahr}`}>
            <EinzelBalken
              reihen={reihen}
              seriesKey="umsatzCent"
              farbe={FARBE_UMSATZ}
              formatWert={(v) => `${euro(v)} €`}
              formatTick={(v) => `${Math.round(v / 100).toLocaleString("de-DE")} €`}
            />
          </ChartCard>

          <button
            onClick={() => setTabelle((v) => !v)}
            className="mb-2 text-sm text-verein-blau underline"
          >
            {tabelle ? "Tabelle ausblenden" : "Als Tabelle anzeigen"}
          </button>
          {tabelle && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="p-1">{ansicht === "jahr" ? "Monat" : "Tag"}</th>
                    <th className="p-1 text-right">Tennis (h)</th>
                    <th className="p-1 text-right">Squash (h)</th>
                    <th className="p-1 text-right">Buchungen</th>
                    <th className="p-1 text-right">Umsatz</th>
                  </tr>
                </thead>
                <tbody>
                  {reihen.map((z) => (
                    <tr key={z.label} className="border-t border-gray-100">
                      <td className="p-1">{z.label}</td>
                      <td className="p-1 text-right">{stunden(z.stundenTennis)}</td>
                      <td className="p-1 text-right">{stunden(z.stundenSquash)}</td>
                      <td className="p-1 text-right">{z.buchungenAnzahl}</td>
                      <td className="p-1 text-right">{euro(z.umsatzCent)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatKachel({
  label,
  wert,
  hervorgehoben,
}: {
  label: string;
  wert: string;
  hervorgehoben?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        hervorgehoben ? "border-verein-blau bg-verein-blau/5" : "border-gray-200 bg-white"
      }`}
    >
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${hervorgehoben ? "text-verein-blau" : "text-gray-900"}`}>
        {wert}
      </div>
    </div>
  );
}

function ChartCard({
  titel,
  untertitel,
  children,
}: {
  titel: string;
  untertitel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-semibold text-verein-blau">{titel}</h3>
        <span className="text-xs text-gray-500">{untertitel}</span>
      </div>
      {children}
    </div>
  );
}

function Legende({ items }: { items: { farbe: string; label: string }[] }) {
  return (
    <div className="mb-2 flex gap-4 text-xs text-gray-600">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: it.farbe }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

// Abgerundetes Balkenende (nur oben), quadratisch an der Grundlinie.
function balkenPfad(x: number, yTop: number, breite: number, hoehe: number, radius: number): string {
  if (hoehe <= 0) return "";
  const r = Math.min(radius, breite / 2, hoehe);
  return `M${x},${yTop + hoehe} L${x},${yTop + r} Q${x},${yTop} ${x + r},${yTop} L${x + breite - r},${yTop} Q${x + breite},${yTop} ${x + breite},${yTop + r} L${x + breite},${yTop + hoehe} Z`;
}

const CHART_HOEHE = 180;
const CHART_BREITE = 1000; // viewBox-Einheiten, skaliert responsiv per SVG width=100%
const PLOT_X0 = 40; // linker Rand für Y-Achsen-Beschriftung
const PLOT_BREITE = CHART_BREITE - PLOT_X0;

function GruppierteBalken({
  reihen,
  seriesA,
  seriesB,
  formatWert,
  formatTick,
}: {
  reihen: Zeile[];
  seriesA: { key: "stundenTennis"; farbe: string; label: string };
  seriesB: { key: "stundenSquash"; farbe: string; label: string };
  formatWert: (v: number) => string;
  formatTick: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const maxWert = Math.max(1, ...reihen.map((z) => Math.max(z.stundenTennis, z.stundenSquash)));
  const gitter = ticks(maxWert);
  const top = gitter[gitter.length - 1];

  const n = reihen.length || 1;
  const bandBreite = PLOT_BREITE / n;
  const balkenBreite = Math.min(20, bandBreite * 0.32);
  const luecke = 2;

  const yVon = (v: number) => CHART_HOEHE - (v / top) * CHART_HOEHE;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${CHART_BREITE} ${CHART_HOEHE + 20}`} className="w-full" style={{ height: 200 }}>
        {gitter.map((g) => (
          <g key={g}>
            <line
              x1={PLOT_X0}
              x2={CHART_BREITE}
              y1={yVon(g)}
              y2={yVon(g)}
              stroke="#e1e0d9"
              strokeWidth={1}
            />
            <text x={PLOT_X0 - 8} y={yVon(g) + 3} fontSize={11} fill="#898781" textAnchor="end">
              {formatTick(g)}
            </text>
          </g>
        ))}
        {reihen.map((z, i) => {
          const cx = PLOT_X0 + i * bandBreite + bandBreite / 2;
          const xa = cx - luecke / 2 - balkenBreite;
          const xb = cx + luecke / 2;
          const ha = (z.stundenTennis / top) * CHART_HOEHE;
          const hb = (z.stundenSquash / top) * CHART_HOEHE;
          const istHover = hover === i;
          return (
            <g
              key={z.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              style={{ cursor: "pointer", outline: "none" }}
            >
              {/* größerer, unsichtbarer Hit-Bereich für die ganze Gruppe */}
              <rect x={PLOT_X0 + i * bandBreite} y={0} width={bandBreite} height={CHART_HOEHE} fill="transparent" />
              <path
                d={balkenPfad(xa, CHART_HOEHE - ha, balkenBreite, ha, 3)}
                fill={seriesA.farbe}
                opacity={istHover ? 1 : 0.9}
              />
              <path
                d={balkenPfad(xb, CHART_HOEHE - hb, balkenBreite, hb, 3)}
                fill={seriesB.farbe}
                opacity={istHover ? 1 : 0.9}
              />
              {istHover && (
                <rect
                  x={PLOT_X0 + i * bandBreite}
                  y={0}
                  width={bandBreite}
                  height={CHART_HOEHE}
                  fill="#00417A"
                  opacity={0.04}
                />
              )}
            </g>
          );
        })}
        {/* Grundlinie */}
        <line x1={PLOT_X0} x2={CHART_BREITE} y1={CHART_HOEHE} y2={CHART_HOEHE} stroke="#c3c2b7" strokeWidth={1} />
        {/* X-Achsen-Labels: bei vielen Kategorien nur jedes n-te anzeigen */}
        {reihen.map((z, i) => {
          const zeigen = n <= 12 || i % Math.ceil(n / 12) === 0;
          if (!zeigen) return null;
          return (
            <text
              key={z.label}
              x={PLOT_X0 + i * bandBreite + bandBreite / 2}
              y={CHART_HOEHE + 14}
              fontSize={11}
              fill="#898781"
              textAnchor="middle"
            >
              {z.label}
            </text>
          );
        })}
      </svg>
      {hover !== null && reihen[hover] && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: `${((PLOT_X0 + (hover + 0.5) * bandBreite) / CHART_BREITE) * 100}%` }}
        >
          <div className="mb-0.5 font-semibold text-gray-900">{reihen[hover].label}</div>
          <div className="flex items-center gap-1.5 text-gray-700">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: seriesA.farbe }} />
            Tennis: <strong>{formatWert(reihen[hover].stundenTennis)}</strong>
          </div>
          <div className="flex items-center gap-1.5 text-gray-700">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: seriesB.farbe }} />
            Squash: <strong>{formatWert(reihen[hover].stundenSquash)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

function EinzelBalken({
  reihen,
  farbe,
  formatWert,
  formatTick,
}: {
  reihen: Zeile[];
  seriesKey: "umsatzCent";
  farbe: string;
  formatWert: (v: number) => string;
  formatTick: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const maxWert = Math.max(1, ...reihen.map((z) => z.umsatzCent));
  const gitter = ticks(maxWert);
  const top = gitter[gitter.length - 1];

  const n = reihen.length || 1;
  const bandBreite = PLOT_BREITE / n;
  const balkenBreite = Math.min(24, bandBreite * 0.6);

  const yVon = (v: number) => CHART_HOEHE - (v / top) * CHART_HOEHE;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${CHART_BREITE} ${CHART_HOEHE + 20}`} className="w-full" style={{ height: 200 }}>
        {gitter.map((g) => (
          <g key={g}>
            <line x1={PLOT_X0} x2={CHART_BREITE} y1={yVon(g)} y2={yVon(g)} stroke="#e1e0d9" strokeWidth={1} />
            <text x={PLOT_X0 - 8} y={yVon(g) + 3} fontSize={11} fill="#898781" textAnchor="end">
              {formatTick(g)}
            </text>
          </g>
        ))}
        {reihen.map((z, i) => {
          const cx = PLOT_X0 + i * bandBreite + bandBreite / 2;
          const x = cx - balkenBreite / 2;
          const h = (z.umsatzCent / top) * CHART_HOEHE;
          const istHover = hover === i;
          return (
            <g
              key={z.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              style={{ cursor: "pointer", outline: "none" }}
            >
              <rect x={PLOT_X0 + i * bandBreite} y={0} width={bandBreite} height={CHART_HOEHE} fill="transparent" />
              <path d={balkenPfad(x, CHART_HOEHE - h, balkenBreite, h, 4)} fill={farbe} opacity={istHover ? 1 : 0.9} />
              {istHover && (
                <rect x={PLOT_X0 + i * bandBreite} y={0} width={bandBreite} height={CHART_HOEHE} fill="#00417A" opacity={0.04} />
              )}
            </g>
          );
        })}
        <line x1={PLOT_X0} x2={CHART_BREITE} y1={CHART_HOEHE} y2={CHART_HOEHE} stroke="#c3c2b7" strokeWidth={1} />
        {reihen.map((z, i) => {
          const zeigen = n <= 12 || i % Math.ceil(n / 12) === 0;
          if (!zeigen) return null;
          return (
            <text key={z.label} x={PLOT_X0 + i * bandBreite + bandBreite / 2} y={CHART_HOEHE + 14} fontSize={11} fill="#898781" textAnchor="middle">
              {z.label}
            </text>
          );
        })}
      </svg>
      {hover !== null && reihen[hover] && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: `${((PLOT_X0 + (hover + 0.5) * bandBreite) / CHART_BREITE) * 100}%` }}
        >
          <div className="mb-0.5 font-semibold text-gray-900">{reihen[hover].label}</div>
          <div className="text-gray-700">
            Umsatz: <strong>{formatWert(reihen[hover].umsatzCent)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
