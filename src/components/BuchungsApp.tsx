"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Platz = { id: number; name: string; typ: string };
type Settings = {
  minDauer: number;
  maxDauer: number;
  codeGueltigMinuten: number;
  leihschlaegerCentProStunde: number;
  ballPreisCent: number;
  smsAktiv: boolean;
  heute: string;
  maxDatum: string;
};
type SlotStatus = "frei" | "belegt" | "gesperrt" | "abo" | "vergangen";
type Preis = {
  platzCent: number;
  leihschlaegerCent: number;
  ballCent: number;
  ermaessigungCent: number;
  gesamtCent: number;
};

const SLOT = 15;

function toMin(z: string) {
  const [h, m] = z.split(":").map(Number);
  return h * 60 + m;
}
function minTo(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function euro(cent: number) {
  return (cent / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function formatDatum(d: string) {
  const [y, m, dd] = d.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, dd)));
}

export default function BuchungsApp({
  plaetze,
  settings,
}: {
  plaetze: Platz[];
  settings: Settings;
}) {
  const [platzId, setPlatzId] = useState<number>(plaetze[0]?.id ?? 0);
  const [datum, setDatum] = useState<string>(settings.heute);
  const [verf, setVerf] = useState<Record<string, SlotStatus> | null>(null);
  const [ladeVerf, setLadeVerf] = useState(false);

  const [startSlot, setStartSlot] = useState<string | null>(null);
  const [dauer, setDauer] = useState<number>(settings.minDauer);

  const [step, setStep] = useState<"auswahl" | "details" | "code" | "fertig">("auswahl");

  // Formularfelder
  const [name, setName] = useState("");
  const [kontakt, setKontakt] = useState("");
  const [leihschlaegerAnzahl, setLeihschlaegerAnzahl] = useState(0);
  const [baelle, setBaelle] = useState(false);
  const [ermaessigung, setErmaessigung] = useState(false);
  const [einwilligung, setEinwilligung] = useState(false);

  const [preis, setPreis] = useState<Preis | null>(null);
  const [buchungId, setBuchungId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bestaetigung, setBestaetigung] = useState<any>(null);

  const platz = plaetze.find((p) => p.id === platzId);

  const slotListe = useMemo(() => (verf ? Object.keys(verf).sort() : []), [verf]);

  const ladeVerfuegbarkeit = useCallback(async () => {
    setLadeVerf(true);
    setStartSlot(null);
    try {
      const res = await fetch(`/api/verfuegbarkeit?platzId=${platzId}&datum=${datum}`);
      const json = await res.json();
      setVerf(json.slots || {});
    } catch {
      setVerf({});
    } finally {
      setLadeVerf(false);
    }
  }, [platzId, datum]);

  useEffect(() => {
    ladeVerfuegbarkeit();
  }, [ladeVerfuegbarkeit]);

  // Aufeinanderfolgende freie Minuten ab dem gewählten Start.
  const freieMinutenAbStart = useMemo(() => {
    if (!startSlot || !verf) return 0;
    let count = 0;
    const idx = slotListe.indexOf(startSlot);
    if (idx < 0) return 0;
    for (let i = idx; i < slotListe.length; i++) {
      // Slots müssen lückenlos aufeinanderfolgen.
      if (i > idx && toMin(slotListe[i]) !== toMin(slotListe[i - 1]) + SLOT) break;
      if (verf[slotListe[i]] !== "frei") break;
      count += SLOT;
    }
    return count;
  }, [startSlot, verf, slotListe]);

  const dauerOptionen = useMemo(() => {
    const max = Math.min(settings.maxDauer, freieMinutenAbStart);
    const opts: number[] = [];
    for (let d = settings.minDauer; d <= max; d += SLOT) opts.push(d);
    return opts;
  }, [freieMinutenAbStart, settings.minDauer, settings.maxDauer]);

  // Dauer anpassen, wenn die aktuelle nicht mehr passt.
  useEffect(() => {
    if (dauerOptionen.length > 0 && !dauerOptionen.includes(dauer)) {
      setDauer(dauerOptionen[0]);
    }
  }, [dauerOptionen, dauer]);

  const gewaehlteSlots = useMemo(() => {
    if (!startSlot) return [];
    const start = toMin(startSlot);
    const anzahl = dauer / SLOT;
    const arr: string[] = [];
    for (let i = 0; i < anzahl; i++) arr.push(minTo(start + i * SLOT));
    return arr;
  }, [startSlot, dauer]);

  const endeZeit = startSlot ? minTo(toMin(startSlot) + dauer) : "";

  // Preisvorschau im Detailschritt aktualisieren.
  useEffect(() => {
    if (step !== "details" || !startSlot) return;
    let abbrechen = false;
    (async () => {
      try {
        const res = await fetch("/api/preis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platzId,
            datum,
            startzeit: startSlot,
            dauerMinuten: dauer,
            leihschlaegerAnzahl,
            baelle,
            ermaessigung,
          }),
        });
        const json = await res.json();
        if (!abbrechen) setPreis(res.ok ? json.preis : null);
      } catch {
        if (!abbrechen) setPreis(null);
      }
    })();
    return () => {
      abbrechen = true;
    };
  }, [step, platzId, datum, startSlot, dauer, leihschlaegerAnzahl, baelle, ermaessigung]);

  function slotKlasse(slot: string) {
    const status = verf?.[slot];
    const imRange = gewaehlteSlots.includes(slot);
    if (imRange) return "bg-verein-blau text-white border-verein-blau";
    if (status === "frei") return "bg-white text-verein-blau border-verein-blau/40 hover:border-verein-blau";
    if (status === "belegt") return "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed";
    if (status === "gesperrt") return "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed";
    if (status === "abo") return "bg-amber-100 text-amber-500 border-amber-200 cursor-not-allowed";
    return "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"; // vergangen
  }

  async function absenden() {
    setFehler(null);
    if (!einwilligung) {
      setFehler("Bitte der Datenschutzerklärung zustimmen.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/buchungen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platzId,
          datum,
          startzeit: startSlot,
          dauerMinuten: dauer,
          name,
          kontakt,
          leihschlaegerAnzahl,
          baelle,
          ermaessigung,
          einwilligung,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFehler(json.fehler || "Buchung fehlgeschlagen.");
        return;
      }
      setBuchungId(json.buchungId);
      setStep("code");
    } catch {
      setFehler("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }

  async function bestaetigen() {
    setFehler(null);
    setBusy(true);
    try {
      const res = await fetch("/api/buchungen/bestaetigen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buchungId, code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFehler(json.fehler || "Bestätigung fehlgeschlagen.");
        return;
      }
      setBestaetigung(json.buchung);
      setStep("fertig");
    } catch {
      setFehler("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }

  function neuStarten() {
    setStep("auswahl");
    setStartSlot(null);
    setName("");
    setKontakt("");
    setLeihschlaegerAnzahl(0);
    setBaelle(false);
    setErmaessigung(false);
    setEinwilligung(false);
    setBuchungId(null);
    setCode("");
    setPreis(null);
    setBestaetigung(null);
    setFehler(null);
    ladeVerfuegbarkeit();
  }

  // ---------------- Render ----------------

  if (step === "fertig" && bestaetigung) {
    const b = bestaetigung;
    const stornoUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/stornieren/${b.stornoToken}`
        : "";
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-5">
        <h2 className="mb-3 text-xl font-bold text-green-800">Buchung bestätigt!</h2>
        <dl className="space-y-1 text-sm text-gray-800">
          <Zeile label="Platz" wert={b.platzName} />
          <Zeile label="Datum" wert={formatDatum(b.datum)} />
          <Zeile
            label="Uhrzeit"
            wert={`${b.startzeit} – ${minTo(toMin(b.startzeit) + b.dauerMinuten)} Uhr (${b.dauerMinuten} Min)`}
          />
          <Zeile
            label="Leihschläger"
            wert={b.leihschlaegerAnzahl > 0 ? String(b.leihschlaegerAnzahl) : "keine"}
          />
          <Zeile label="Bälle" wert={b.baelle ? "ja" : "nein"} />
        </dl>
        <p className="mt-4 rounded bg-verein-gelb/40 p-3 text-lg font-bold text-verein-blau">
          Vor Ort zu zahlen: {euro(b.gesamtpreisCent)} €
        </p>
        <p className="mt-1 text-sm text-gray-600">Die Bezahlung erfolgt vor Ort.</p>
        <div className="mt-4 text-sm">
          <p className="font-semibold">Stornieren:</p>
          <a className="break-all text-verein-blau underline" href={stornoUrl}>
            {stornoUrl}
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Bitte nach dem Spiel die Fenster schließen und das Licht ausschalten. Vielen Dank!
        </p>
        <button
          onClick={neuStarten}
          className="mt-5 rounded bg-verein-blau px-4 py-2 font-semibold text-white"
        >
          Neue Buchung
        </button>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="rounded-lg border border-gray-200 p-5">
        <h2 className="mb-2 text-xl font-bold text-verein-blau">Code eingeben</h2>
        <p className="mb-4 text-sm text-gray-600">
          Wir haben einen 6-stelligen Code an <strong>{kontakt}</strong> gesendet. Bitte innerhalb
          von {settings.codeGueltigMinuten} Minuten eingeben.
        </p>
        <input
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          className="w-full rounded border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest"
        />
        {fehler && <p className="mt-3 text-sm text-red-600">{fehler}</p>}
        <button
          onClick={bestaetigen}
          disabled={busy || code.length !== 6}
          className="mt-4 w-full rounded bg-verein-blau px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Prüfe…" : "Buchung bestätigen"}
        </button>
        <button onClick={neuStarten} className="mt-2 w-full text-sm text-gray-500 underline">
          Abbrechen
        </button>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="rounded-lg border border-gray-200 p-5">
        <h2 className="mb-3 text-xl font-bold text-verein-blau">Buchungsdetails</h2>
        <div className="mb-4 rounded bg-gray-50 p-3 text-sm">
          <p>
            <strong>{platz?.name}</strong> · {formatDatum(datum)}
          </p>
          <p>
            {startSlot} – {endeZeit} Uhr ({dauer} Min)
          </p>
        </div>

        <label className="mb-3 block">
          <span className="text-sm font-medium">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Vor- und Nachname"
          />
        </label>

        <label className="mb-1 block">
          <span className="text-sm font-medium">E-Mail oder Handynummer</span>
          <input
            value={kontakt}
            onChange={(e) => setKontakt(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            placeholder="name@beispiel.de oder 0151 …"
          />
        </label>
        <p className="mb-3 text-xs text-gray-500">
          {settings.smsAktiv
            ? "Der Bestätigungscode kommt per E-Mail oder SMS."
            : "Der Bestätigungscode wird per E-Mail versendet."}
        </p>

        <label className="mb-3 block">
          <span className="text-sm font-medium">Leihschläger</span>
          <select
            value={leihschlaegerAnzahl}
            onChange={(e) => setLeihschlaegerAnzahl(Number(e.target.value))}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "keine" : `${n} Stück`}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-500">
            1,- € pro Schläger und Stunde (anteilig).
          </span>
        </label>

        <label className="mb-3 flex items-center gap-2">
          <input type="checkbox" checked={baelle} onChange={(e) => setBaelle(e.target.checked)} />
          <span className="text-sm">
            Bälle benötigt{settings.ballPreisCent === 0 ? " (inklusive)" : ""}
          </span>
        </label>

        <label className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={ermaessigung}
            onChange={(e) => setErmaessigung(e.target.checked)}
          />
          <span className="text-sm">Ermäßigung Schüler/Studenten (vor Ort nachweisen)</span>
        </label>

        {preis && (
          <div className="mb-4 rounded border border-gray-200 p-3 text-sm">
            <Zeile label="Platz" wert={`${euro(preis.platzCent)} €`} />
            {preis.leihschlaegerCent > 0 && (
              <Zeile label="Leihschläger" wert={`${euro(preis.leihschlaegerCent)} €`} />
            )}
            {preis.ballCent > 0 && <Zeile label="Bälle" wert={`${euro(preis.ballCent)} €`} />}
            {preis.ermaessigungCent > 0 && (
              <Zeile label="Ermäßigung" wert={`– ${euro(preis.ermaessigungCent)} €`} />
            )}
            <div className="mt-2 border-t pt-2 text-base font-bold text-verein-blau">
              Vor Ort zu zahlen: {euro(preis.gesamtCent)} €
            </div>
            <a
              href="/preise"
              target="_blank"
              className="mt-2 inline-block text-xs text-verein-blau underline"
            >
              Preise &amp; Rabatte nachvollziehen
            </a>
          </div>
        )}

        <label className="mb-3 flex items-start gap-2">
          <input
            type="checkbox"
            checked={einwilligung}
            onChange={(e) => setEinwilligung(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm">
            Ich habe die{" "}
            <a href="/datenschutz" target="_blank" className="text-verein-blau underline">
              Datenschutzerklärung
            </a>{" "}
            gelesen und stimme der Verarbeitung meiner Daten zur Buchung zu.
          </span>
        </label>

        {fehler && <p className="mb-3 text-sm text-red-600">{fehler}</p>}

        <button
          onClick={absenden}
          disabled={busy || !name || !kontakt || !einwilligung}
          className="w-full rounded bg-verein-blau px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Sende Code…" : "Code anfordern"}
        </button>
        <button
          onClick={() => setStep("auswahl")}
          className="mt-2 w-full text-sm text-gray-500 underline"
        >
          Zurück
        </button>
      </div>
    );
  }

  // step === "auswahl"
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {plaetze.map((p) => (
          <ToggleBtn
            key={p.id}
            aktiv={p.id === platzId}
            onClick={() => setPlatzId(p.id)}
            label={p.name}
          />
        ))}
      </div>

      <label className="mb-4 block">
        <span className="text-sm font-medium">Datum</span>
        <input
          type="date"
          value={datum}
          min={settings.heute}
          max={settings.maxDatum}
          onChange={(e) => setDatum(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </label>

      <div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-600">
        <Legende klasse="bg-white border-verein-blau/40" text="frei" />
        <Legende klasse="bg-verein-blau" text="ausgewählt" />
        <Legende klasse="bg-gray-200" text="belegt" />
        <Legende klasse="bg-amber-100" text="Abo" />
      </div>

      {ladeVerf ? (
        <p className="py-8 text-center text-gray-500">Lade Verfügbarkeit…</p>
      ) : slotListe.length === 0 ? (
        <p className="py-8 text-center text-gray-500">Keine Slots verfügbar.</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {slotListe.map((slot) => (
            <button
              key={slot}
              disabled={verf?.[slot] !== "frei" && !gewaehlteSlots.includes(slot)}
              onClick={() => setStartSlot(slot)}
              className={`rounded border px-1 py-2 text-sm ${slotKlasse(slot)}`}
            >
              {slot}
            </button>
          ))}
        </div>
      )}

      {startSlot && (
        <div className="sticky bottom-0 mt-4 rounded-lg border border-verein-blau bg-white p-4 shadow-lg">
          <p className="text-sm">
            <strong>{platz?.name}</strong> · {startSlot} – {endeZeit} Uhr
          </p>
          <label className="mt-2 block">
            <span className="text-sm font-medium">Dauer</span>
            <select
              value={dauer}
              onChange={(e) => setDauer(Number(e.target.value))}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            >
              {dauerOptionen.map((d) => (
                <option key={d} value={d}>
                  {d} Minuten{d % 60 === 0 ? ` (${d / 60} Std)` : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              setFehler(null);
              setStep("details");
            }}
            className="mt-3 w-full rounded bg-verein-blau px-4 py-3 font-semibold text-white"
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}

function Zeile({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium">{wert}</dd>
    </div>
  );
}

function ToggleBtn({
  aktiv,
  onClick,
  label,
}: {
  aktiv: boolean;
  onClick: () => void;
  label: string;
}) {
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
