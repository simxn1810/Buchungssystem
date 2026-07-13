"use client";

import { useState } from "react";

type Buchung = {
  id: number;
  platzName: string;
  datum: string;
  startzeit: string;
  dauerMinuten: number;
  gesamtpreisCent: number;
  leihschlaegerAnzahl: number;
  baelle: boolean;
};

function euro(c: number) {
  return (c / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function toMin(z: string) {
  const [h, m] = z.split(":").map(Number);
  return h * 60 + m;
}
function minTo(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
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

export default function MeineBuchungen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [buchungen, setBuchungen] = useState<Buchung[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [storniertIds, setStorniertIds] = useState<number[]>([]);

  async function suchen() {
    setFehler(null);
    setBusy(true);
    setStorniertIds([]);
    try {
      const res = await fetch("/api/buchungen/suchen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFehler(json.fehler || "Suche fehlgeschlagen.");
        setBuchungen(null);
        return;
      }
      setBuchungen(json.buchungen);
    } catch {
      setFehler("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }

  async function stornieren(id: number) {
    if (!confirm("Diese Buchung wirklich stornieren?")) return;
    setFehler(null);
    try {
      const res = await fetch("/api/buchungen/storno-kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buchungId: id, name, email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFehler(json.fehler || "Stornierung fehlgeschlagen.");
        return;
      }
      setStorniertIds((s) => [...s, id]);
    } catch {
      setFehler("Netzwerkfehler. Bitte erneut versuchen.");
    }
  }

  return (
    <div>
      <div className="rounded-lg border border-gray-200 p-5">
        <label className="mb-3 block">
          <span className="text-sm font-medium">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Vor- und Nachname"
          />
        </label>
        <label className="mb-4 block">
          <span className="text-sm font-medium">E-Mail-Adresse</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            placeholder="name@beispiel.de"
          />
        </label>
        <p className="mb-3 text-xs text-gray-500">
          Hinweis: Es werden nur Buchungen angezeigt, die per E-Mail vorgenommen wurden. Name und
          E-Mail müssen mit der Buchung übereinstimmen.
        </p>
        {fehler && <p className="mb-3 text-sm text-red-600">{fehler}</p>}
        <button
          onClick={suchen}
          disabled={busy || !name || !email}
          className="w-full rounded bg-verein-gelb px-4 py-3 font-semibold text-verein-blau disabled:opacity-50"
        >
          {busy ? "Suche…" : "Buchungen anzeigen"}
        </button>
      </div>

      {buchungen !== null && (
        <div className="mt-6">
          {buchungen.length === 0 ? (
            <p className="text-gray-500">
              Keine kommenden Buchungen zu diesen Angaben gefunden.
            </p>
          ) : (
            <ul className="space-y-3">
              {buchungen.map((b) => {
                const storniert = storniertIds.includes(b.id);
                return (
                  <li
                    key={b.id}
                    className={`rounded-lg border p-4 text-sm ${
                      storniert ? "border-gray-200 bg-gray-50 opacity-60" : "border-gray-200"
                    }`}
                  >
                    <div className="font-semibold text-verein-blau">{b.platzName}</div>
                    <div>{formatDatum(b.datum)}</div>
                    <div>
                      {b.startzeit} – {minTo(toMin(b.startzeit) + b.dauerMinuten)} Uhr (
                      {b.dauerMinuten} Min)
                    </div>
                    <div className="text-gray-600">
                      Vor Ort zu zahlen: {euro(b.gesamtpreisCent)} €
                      {b.leihschlaegerAnzahl > 0 && ` · ${b.leihschlaegerAnzahl} Leihschläger`}
                      {b.baelle && " · Bälle"}
                    </div>
                    {storniert ? (
                      <p className="mt-2 font-medium text-green-700">Storniert.</p>
                    ) : (
                      <button
                        onClick={() => stornieren(b.id)}
                        className="mt-3 rounded bg-red-600 px-4 py-2 font-semibold text-white"
                      >
                        Stornieren
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
