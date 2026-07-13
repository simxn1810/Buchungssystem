"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
      // Für Kunden nicht von "belegt" unterscheidbar
      return "bg-gray-200 text-gray-500";
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

  // Höhe des Rasters wird an den verfügbaren Platz im Fenster angepasst,
  // damit die komplette Woche ohne Scrollen sichtbar ist.
  const gitterRef = useRef<HTMLDivElement>(null);
  const [gitterHoehe, setGitterHoehe] = useState<number | null>(null);

  useEffect(() => {
    function berechneHoehe() {
      const el = gitterRef.current;
      if (!el) return;
      const oben = el.getBoundingClientRect().top;
      const verfuegbar = window.innerHeight - oben - 8;
      setGitterHoehe(Math.max(verfuegbar, 240));
    }
    berechneHoehe();
    window.addEventListener("resize", berechneHoehe);
    return () => window.removeEventListener("resize", berechneHoehe);
  }, [daten]);

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
        <Legende klasse="bg-amber-100" text="Abo/Training" />
      </div>

      {lade || !daten ? (
        <p className="py-8 text-center text-gray-500">Lade Übersicht…</p>
      ) : (
        <div ref={gitterRef} style={{ height: gitterHoehe ?? undefined }} className="overflow-x-auto overflow-y-hidden">
          <GitterAnsicht
            daten={daten}
            heute={heute}
            mehrereProTag={mehrereProTag}
          />
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

// Kalenderraster als CSS-Grid: Zeitzeilen bekommen "1fr" und teilen sich so
// gleichmäßig die verfügbare Höhe des Elternelements auf – dadurch passt die
// ganze Woche ohne Scrollen ins Fenster, statt eine feste Zeilenhöhe zu erzwingen.
function GitterAnsicht({
  daten,
  heute,
  mehrereProTag,
}: {
  daten: Uebersicht;
  heute: string;
  mehrereProTag: boolean;
}) {
  const kopfZeilen = mehrereProTag ? 2 : 1;
  const spaltenProTag = daten.plaetze.length;
  const gesamtSpalten = daten.tage.length * spaltenProTag;

  function spalte(tagIndex: number, platzIndex: number) {
    return 2 + tagIndex * spaltenProTag + platzIndex;
  }

  return (
    <div
      className="grid h-full min-w-max text-center text-xs"
      style={{
        gridTemplateColumns: `2.5rem repeat(${gesamtSpalten}, minmax(1.5rem, 1fr))`,
        gridTemplateRows: `repeat(${kopfZeilen}, auto) repeat(${daten.zeiten.length}, minmax(0, 1fr))`,
      }}
    >
      <div
        className="sticky left-0 z-10 bg-white"
        style={{ gridColumn: 1, gridRow: `1 / span ${kopfZeilen}` }}
      />

      {daten.tage.map((d, tagIndex) => {
        const istHeute = d === heute;
        return (
          <div
            key={d}
            className="border-l-2 border-gray-300 p-1"
            style={{ gridColumn: `${spalte(tagIndex, 0)} / span ${spaltenProTag}`, gridRow: 1 }}
          >
            <div className={istHeute ? "font-bold text-verein-blau" : "text-gray-600"}>
              {tagKurz(d)}
            </div>
            <div className={istHeute ? "font-bold text-verein-blau" : "text-gray-400"}>
              {tagNummer(d)}.{d.split("-")[1]}.
            </div>
          </div>
        );
      })}

      {mehrereProTag &&
        daten.tage.map((d, tagIndex) =>
          daten.plaetze.map((p, i) => (
            <div
              key={`${d}-${p.id}-kopf`}
              className={`p-0.5 text-[10px] font-normal text-gray-400 ${
                i === 0 ? "border-l-2 border-gray-300" : "border-l border-gray-100"
              }`}
              style={{ gridColumn: spalte(tagIndex, i), gridRow: 2 }}
            >
              {p.name}
            </div>
          ))
        )}

      {daten.zeiten.map((zeit, zeitIndex) => (
        <div
          key={`${zeit}-label`}
          className="sticky left-0 z-10 flex items-center justify-end bg-white pr-2 font-medium leading-none text-gray-500"
          style={{ gridColumn: 1, gridRow: kopfZeilen + 1 + zeitIndex }}
        >
          {zeit}
        </div>
      ))}

      {daten.tage.map((d, tagIndex) =>
        daten.plaetze.map((p, i) =>
          daten.zeiten.map((zeit, zeitIndex) => {
            const status = daten.zellen[d]?.[p.id]?.[zeit];
            return (
              <div
                key={`${d}-${p.id}-${zeit}`}
                className={`flex items-center justify-center p-0.5 ${
                  i === 0 ? "border-l-2 border-gray-300" : "border-l border-gray-100"
                }`}
                style={{ gridColumn: spalte(tagIndex, i), gridRow: kopfZeilen + 1 + zeitIndex }}
              >
                <div
                  className={`flex h-full w-full items-center justify-center rounded text-[10px] font-medium ${zellKlasse(
                    status ?? "vergangen",
                    i
                  )}`}
                >
                  {zellInhalt(status ?? "vergangen")}
                </div>
              </div>
            );
          })
        )
      )}
    </div>
  );
}
