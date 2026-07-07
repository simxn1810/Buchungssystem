"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ZellStatus = "frei" | "belegt" | "gesperrt" | "abo" | "vergangen";
type Zelle = { frei: number; gesamt: number; status: ZellStatus };
type Uebersicht = {
  tage: string[];
  stunden: string[];
  zellen: Record<string, Record<string, Zelle>>;
};

// --- Datums-Helfer (String-basiert, UTC, analog Backend) ---
function addTage(datum: string, tage: number): string {
  const [y, m, d] = datum.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + tage);
  return dt.toISOString().slice(0, 10);
}
function montagDerWoche(datum: string): string {
  const [y, m, d] = datum.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const tag = dt.getUTCDay();
  const diff = tag === 0 ? -6 : 1 - tag;
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}
const WOCHENTAGE_KURZ = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
function tagKurz(datum: string): string {
  const [y, m, d] = datum.split("-").map(Number);
  const tag = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=So..6=Sa
  return WOCHENTAGE_KURZ[(tag + 6) % 7];
}
function tagNummer(datum: string): string {
  return String(Number(datum.split("-")[2]));
}

function zellKlasse(status: ZellStatus): string {
  switch (status) {
    case "frei":
      return "bg-green-100 text-green-800";
    case "belegt":
      return "bg-gray-200 text-gray-500";
    case "gesperrt":
      return "bg-red-100 text-red-500";
    case "abo":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-50 text-gray-300"; // vergangen
  }
}

function zellInhalt(z: Zelle): string {
  if (z.status === "frei") return z.gesamt > 1 ? String(z.frei) : "frei";
  if (z.status === "abo") return "Abo";
  if (z.status === "gesperrt") return "\u2013";
  if (z.status === "belegt") return "\u2013";
  return "";
}

export default function KalenderApp({ heute, maxDatum }: { heute: string; maxDatum: string }) {
  const [typ, setTyp] = useState<"tennis" | "squash">("tennis");
  const [start, setStart] = useState<string>(montagDerWoche(heute));
  const [daten, setDaten] = useState<Uebersicht | null>(null);
  const [lade, setLade] = useState(false);

  const heuteMontag = useMemo(() => montagDerWoche(heute), [heute]);
  const maxMontag = useMemo(() => montagDerWoche(maxDatum), [maxDatum]);
  const kannZurueck = start > heuteMontag;
  const kannVor = start < maxMontag;

  const laden = useCallback(async () => {
    setLade(true);
    try {
      const res = await fetch(`/api/kalender?typ=${typ}&start=${start}`);
      const json = await res.json();
      setDaten(res.ok ? json : null);
    } catch {
      setDaten(null);
    } finally {
      setLade(false);
    }
  }, [typ, start]);

  useEffect(() => {
    laden();
  }, [laden]);

  const wochenLabel = daten
    ? `${tagNummer(daten.tage[0])}.${daten.tage[0].split("-")[1]}. \u2013 ${tagNummer(
        daten.tage[6]
      )}.${daten.tage[6].split("-")[1]}.${daten.tage[6].split("-")[0].slice(2)}`
    : "";

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip aktiv={typ === "tennis"} onClick={() => setTyp("tennis")} label="Tennis (2 Plätze)" />
        <Chip aktiv={typ === "squash"} onClick={() => setTyp("squash")} label="Squash" />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setStart(addTage(start, -7))}
          disabled={!kannZurueck}
          className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
        >
          &larr; Woche
        </button>
        <span className="text-sm font-medium text-verein-blau">{wochenLabel}</span>
        <button
          onClick={() => setStart(addTage(start, 7))}
          disabled={!kannVor}
          className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
        >
          Woche &rarr;
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-600">
        {typ === "tennis" ? (
          <Legende klasse="bg-green-100" text="Zahl = freie Plätze" />
        ) : (
          <Legende klasse="bg-green-100" text="frei" />
        )}
        <Legende klasse="bg-gray-200" text="belegt" />
        <Legende klasse="bg-red-100" text="gesperrt" />
        <Legende klasse="bg-amber-100" text="Abo/Training" />
      </div>

      {lade || !daten ? (
        <p className="py-8 text-center text-gray-500">Lade &Uuml;bersicht&hellip;</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white p-1 text-gray-500"></th>
                {daten.tage.map((d) => {
                  const istHeute = d === heute;
                  return (
                    <th key={d} className="p-1">
                      <div className={istHeute ? "font-bold text-verein-blau" : "text-gray-600"}>
                        {tagKurz(d)}
                      </div>
                      <div className={istHeute ? "font-bold text-verein-blau" : "text-gray-400"}>
                        {tagNummer(d)}.{d.split("-")[1]}.
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {daten.stunden.map((stunde) => (
                <tr key={stunde}>
                  <td className="sticky left-0 bg-white p-1 text-right font-medium text-gray-500">
                    {stunde}
                  </td>
                  {daten.tage.map((d) => {
                    const z = daten.zellen[d]?.[stunde];
                    if (!z) return <td key={d} className="p-0.5" />;
                    return (
                      <td key={d} className="p-0.5">
                        <div
                          className={`rounded py-1 text-[11px] font-medium ${zellKlasse(z.status)}`}
                        >
                          {zellInhalt(z)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500">
        Anzeige pro voller Stunde. Genaue 15-Minuten-Zeiten und die Buchung findest du auf der{" "}
        <a href="/" className="text-verein-blau underline">
          Buchungsseite
        </a>
        .
      </p>
    </div>
  );
}

function Chip({ aktiv, onClick, label }: { aktiv: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium ${
        aktiv
          ? "border-verein-blau bg-verein-blau text-white"
          : "border-gray-300 bg-white text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

function Legende({ klasse, text }: { klasse: string; text: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-3 w-3 rounded border ${klasse}`} />
      {text}
    </span>
  );
}
