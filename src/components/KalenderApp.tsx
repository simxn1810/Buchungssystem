"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ZellStatus = "frei" | "belegt" | "gesperrt" | "abo" | "vergangen";
type Platz = { id: number; name: string };
type Uebersicht = {
  tage: string[];
  zeiten: string[];
  plaetze: Platz[];
  // zellen[datum][platzId][zeit] = ZellStatus
  zellen: Record<string, Record<number, Record<string, ZellStatus>>>;
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

function zellKlasse(status: ZellStatus, platzIndex = 0): string {
  switch (status) {
    case "frei":
      // Zwei Grüntöne, um die beiden Plätze zu unterscheiden
      return platzIndex === 0
        ? "bg-green-100 text-green-800"
        : "bg-emerald-300 text-emerald-900";
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

function zellInhalt(status: ZellStatus): string {
  if (status === "frei") return "frei";
  if (status === "abo") return "Abo";
  if (status === "gesperrt") return "\u2013";
  if (status === "belegt") return "\u2013";
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

  const mehrereProTag = (daten?.plaetze.length ?? 0) > 1;

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
        <Legende klasse="bg-green-100" text="frei (Platz 1)" />
        <Legende klasse="bg-emerald-300" text="frei (Platz 2)" />
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
                <th rowSpan={mehrereProTag ? 2 : 1} className="sticky left-0 bg-white p-1 text-gray-500"></th>
                {daten.tage.map((d) => {
                  const istHeute = d === heute;
                  return (
                    <th
                      key={d}
                      colSpan={daten.plaetze.length}
                      className="border-l-2 border-gray-300 p-1"
                    >
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
              {mehrereProTag && (
                <tr>
                  {daten.tage.map((d) =>
                    daten.plaetze.map((p, i) => (
                      <th
                        key={`${d}-${p.id}`}
                        className={`p-0.5 text-[10px] font-normal text-gray-400 ${
                          i === 0 ? "border-l-2 border-gray-300" : "border-l border-gray-100"
                        }`}
                      >
                        {p.name}
                      </th>
                    ))
                  )}
                </tr>
              )}
            </thead>
            <tbody>
              {daten.zeiten.map((zeit) => (
                <tr key={zeit}>
                  <td className="sticky left-0 bg-white p-1 pr-2 text-right align-top font-medium leading-none text-gray-500">
                    <span className="-translate-y-1/2 inline-block">{zeit}</span>
                  </td>
                  {daten.tage.map((d) =>
                    daten.plaetze.map((p, i) => {
                      const status = daten.zellen[d]?.[p.id]?.[zeit];
                      return (
                        <td
                          key={`${d}-${p.id}`}
                          className={`p-0.5 ${
                            i === 0 ? "border-l-2 border-gray-300" : "border-l border-gray-100"
                          }`}
                        >
                          <div
                            className={`rounded py-0.5 text-[10px] font-medium ${zellKlasse(
                              status ?? "vergangen",
                              i
                            )}`}
                          >
                            {zellInhalt(status ?? "vergangen")}
                          </div>
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500">
        Anzeige je Platz in 15-Minuten-Schritten. Die Buchung findest du auf der{" "}
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
