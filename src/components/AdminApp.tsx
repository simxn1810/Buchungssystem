"use client";

import { useCallback, useEffect, useState } from "react";

type Platz = { id: number; name: string };
type Buchung = {
  id: number;
  platz: { name: string };
  datum: string;
  startzeit: string;
  dauerMinuten: number;
  name: string;
  kontakt: string;
  gesamtpreisCent: number;
  status: string;
  leihschlaegerAnzahl: number;
  baelle: boolean;
};
type Sperrung = {
  id: number;
  datum: string;
  slot: string;
  grund: string;
  platzId: number | null;
  platz: { name: string } | null;
};
type Tarif = {
  id: number;
  sportart: string;
  saison: string;
  mitglied: boolean;
  wochentagGruppe: string;
  zeitVon: string;
  zeitBis: string;
  preisProStundeCent: number;
};

function euro(c: number) {
  return (c / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function minTo(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function toMin(z: string) {
  const [h, m] = z.split(":").map(Number);
  return h * 60 + m;
}

export default function AdminApp({ plaetze, heute }: { plaetze: Platz[]; heute: string }) {
  const [tab, setTab] = useState<"buchungen" | "sperrungen" | "tarife" | "zugangscodes">(
    "buchungen"
  );

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-verein-blau">Admin</h1>
        <button onClick={logout} className="text-sm text-gray-500 underline">
          Abmelden
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <Tab aktiv={tab === "buchungen"} onClick={() => setTab("buchungen")} label="Buchungen" />
        <Tab aktiv={tab === "sperrungen"} onClick={() => setTab("sperrungen")} label="Sperrzeiten" />
        <Tab aktiv={tab === "tarife"} onClick={() => setTab("tarife")} label="Tarife" />
        <Tab
          aktiv={tab === "zugangscodes"}
          onClick={() => setTab("zugangscodes")}
          label="Zugangscodes"
        />
      </div>

      {tab === "buchungen" && <BuchungenTab heute={heute} />}
      {tab === "sperrungen" && <SperrungenTab plaetze={plaetze} heute={heute} />}
      {tab === "tarife" && <TarifeTab />}
      {tab === "zugangscodes" && <ZugangscodesTab />}
    </div>
  );
}

function BuchungenTab({ heute }: { heute: string }) {
  const [datum, setDatum] = useState(heute);
  const [buchungen, setBuchungen] = useState<Buchung[]>([]);
  const [lade, setLade] = useState(false);

  const laden = useCallback(async () => {
    setLade(true);
    const res = await fetch(`/api/admin/buchungen?datum=${datum}`);
    const json = await res.json();
    setBuchungen(json.buchungen || []);
    setLade(false);
  }, [datum]);

  useEffect(() => {
    laden();
  }, [laden]);

  async function stornieren(id: number) {
    if (!confirm("Diese Buchung wirklich stornieren?")) return;
    await fetch(`/api/admin/buchungen?id=${id}`, { method: "DELETE" });
    laden();
  }

  return (
    <div>
      <label className="mb-4 block">
        <span className="text-sm font-medium">Tag</span>
        <input
          type="date"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </label>

      {lade ? (
        <p className="text-gray-500">Lade…</p>
      ) : buchungen.length === 0 ? (
        <p className="text-gray-500">Keine Buchungen an diesem Tag.</p>
      ) : (
        <ul className="space-y-2">
          {buchungen.map((b) => (
            <li key={b.id} className="rounded border border-gray-200 p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">
                  {b.platz.name} · {b.startzeit}–{minTo(toMin(b.startzeit) + b.dauerMinuten)}
                </span>
                <span
                  className={
                    b.status === "bestaetigt" ? "text-green-700" : "text-amber-600"
                  }
                >
                  {b.status}
                </span>
              </div>
              <div className="text-gray-600">
                {b.name} · {b.kontakt}
              </div>
              <div className="text-gray-600">
                {euro(b.gesamtpreisCent)} € · Schlaeger: {b.leihschlaegerAnzahl} · Baelle:{" "}
                {b.baelle ? "ja" : "nein"}
              </div>
              <button
                onClick={() => stornieren(b.id)}
                className="mt-2 text-xs text-red-600 underline"
              >
                Stornieren
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SperrungenTab({ plaetze, heute }: { plaetze: Platz[]; heute: string }) {
  const [datum, setDatum] = useState(heute);
  const [platzId, setPlatzId] = useState<string>(""); // "" = alle
  const [von, setVon] = useState("18:00");
  const [bis, setBis] = useState("22:00");
  const [grund, setGrund] = useState("");
  const [sperrungen, setSperrungen] = useState<Sperrung[]>([]);
  const [fehler, setFehler] = useState<string | null>(null);

  const laden = useCallback(async () => {
    const res = await fetch(`/api/admin/sperrungen?datum=${datum}`);
    const json = await res.json();
    setSperrungen(json.sperrungen || []);
  }, [datum]);

  useEffect(() => {
    laden();
  }, [laden]);

  async function anlegen() {
    setFehler(null);
    const res = await fetch("/api/admin/sperrungen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        datum,
        platzId: platzId === "" ? null : Number(platzId),
        von,
        bis,
        grund,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFehler(json.fehler || "Fehler beim Anlegen.");
      return;
    }
    setGrund("");
    laden();
  }

  async function loeschen(s: Sperrung) {
    // Gruppenweise loeschen (datum + grund), da ein Zeitraum viele Slots erzeugt.
    await fetch(
      `/api/admin/sperrungen?datum=${encodeURIComponent(s.datum)}&grund=${encodeURIComponent(s.grund)}`,
      { method: "DELETE" }
    );
    laden();
  }

  // Sperrungen gruppieren nach datum+grund+platz fuer die Anzeige.
  const gruppen = Object.values(
    sperrungen.reduce((acc: Record<string, { s: Sperrung; slots: string[] }>, s) => {
      const key = `${s.datum}|${s.grund}|${s.platzId ?? "alle"}`;
      if (!acc[key]) acc[key] = { s, slots: [] };
      acc[key].slots.push(s.slot);
      return acc;
    }, {})
  );

  return (
    <div>
      <div className="mb-4 rounded border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold text-verein-blau">Sperrzeit anlegen</h2>
        <label className="mb-2 block">
          <span className="text-sm">Datum</span>
          <input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="mb-2 block">
          <span className="text-sm">Platz</span>
          <select
            value={platzId}
            onChange={(e) => setPlatzId(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Alle Plaetze</option>
            {plaetze.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mb-2 flex gap-2">
          <label className="flex-1">
            <span className="text-sm">Von</span>
            <input
              type="time"
              step={900}
              value={von}
              onChange={(e) => setVon(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex-1">
            <span className="text-sm">Bis</span>
            <input
              type="time"
              step={900}
              value={bis}
              onChange={(e) => setBis(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
        </div>
        <label className="mb-3 block">
          <span className="text-sm">Grund</span>
          <input
            value={grund}
            onChange={(e) => setGrund(e.target.value)}
            placeholder="z. B. Wartung, Mannschaftstraining"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
        {fehler && <p className="mb-2 text-sm text-red-600">{fehler}</p>}
        <button
          onClick={anlegen}
          disabled={!grund}
          className="w-full rounded bg-verein-blau px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          Sperrzeit anlegen
        </button>
      </div>

      <h2 className="mb-2 font-semibold text-verein-blau">Sperrzeiten am {datum}</h2>
      {gruppen.length === 0 ? (
        <p className="text-gray-500">Keine Sperrzeiten.</p>
      ) : (
        <ul className="space-y-2">
          {gruppen.map((g, i) => {
            const sorted = g.slots.sort();
            const von = sorted[0];
            const bis = minTo(toMin(sorted[sorted.length - 1]) + 15);
            return (
              <li key={i} className="rounded border border-gray-200 p-3 text-sm">
                <div className="flex justify-between">
                  <span>
                    {g.s.platz?.name ?? "Alle Plaetze"} · {von}–{bis}
                  </span>
                  <button onClick={() => loeschen(g.s)} className="text-xs text-red-600 underline">
                    Loeschen
                  </button>
                </div>
                <div className="text-gray-600">{g.s.grund}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TarifeTab() {
  const [tarife, setTarife] = useState<Tarif[]>([]);
  const [werte, setWerte] = useState<Record<number, string>>({});
  const [gespeichert, setGespeichert] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/tarife");
      const json = await res.json();
      setTarife(json.tarife || []);
      const w: Record<number, string> = {};
      (json.tarife || []).forEach((t: Tarif) => {
        w[t.id] = (t.preisProStundeCent / 100).toFixed(2);
      });
      setWerte(w);
    })();
  }, []);

  async function speichern() {
    const updates = tarife.map((t) => ({
      id: t.id,
      preisProStundeCent: Math.round(parseFloat((werte[t.id] || "0").replace(",", ".")) * 100),
    }));
    await fetch("/api/admin/tarife", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    setGespeichert(true);
    setTimeout(() => setGespeichert(false), 2000);
  }

  return (
    <div>
      <p className="mb-3 text-sm text-amber-700">
        Hinweis: Die hinterlegten Startwerte vor dem Live-Gang mit dem Verein abstimmen. Preise pro
        Stunde in Euro.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="p-1">Sport</th>
              <th className="p-1">Saison</th>
              <th className="p-1">Tarif</th>
              <th className="p-1">Tag</th>
              <th className="p-1">Zeit</th>
              <th className="p-1">€/Std</th>
            </tr>
          </thead>
          <tbody>
            {tarife.map((t) => (
              <tr key={t.id} className="border-t border-gray-100">
                <td className="p-1">{t.sportart}</td>
                <td className="p-1">{t.saison}</td>
                <td className="p-1">{t.mitglied ? "Mitglied" : "Gast"}</td>
                <td className="p-1">{t.wochentagGruppe}</td>
                <td className="p-1">
                  {t.zeitVon}–{t.zeitBis}
                </td>
                <td className="p-1">
                  <input
                    value={werte[t.id] ?? ""}
                    onChange={(e) => setWerte({ ...werte, [t.id]: e.target.value })}
                    className="w-16 rounded border border-gray-300 px-1 py-1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={speichern}
        className="mt-4 rounded bg-verein-blau px-4 py-2 font-semibold text-white"
      >
        Speichern
      </button>
      {gespeichert && <span className="ml-3 text-sm text-green-700">Gespeichert.</span>}
    </div>
  );
}

type Zugangscode = { id: number; wochentag: string; code: string };

const WOCHENTAG_LABEL: Record<string, string> = {
  montag: "Montag",
  dienstag: "Dienstag",
  mittwoch: "Mittwoch",
  donnerstag: "Donnerstag",
  freitag: "Freitag",
  samstag: "Samstag",
  sonntag: "Sonntag",
};
const WOCHENTAGE = ["montag", "dienstag", "mittwoch", "donnerstag", "freitag", "samstag", "sonntag"];

function ZugangscodesTab() {
  const [werte, setWerte] = useState<Record<string, string>>({});
  const [gespeichert, setGespeichert] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/zugangscodes");
      const json = await res.json();
      const w: Record<string, string> = {};
      WOCHENTAGE.forEach((tag) => (w[tag] = ""));
      (json.codes || []).forEach((c: Zugangscode) => {
        w[c.wochentag] = c.code;
      });
      setWerte(w);
    })();
  }, []);

  async function speichern() {
    const updates = WOCHENTAGE.map((tag) => ({ wochentag: tag, code: (werte[tag] || "").trim() }));
    await fetch("/api/admin/zugangscodes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    setGespeichert(true);
    setTimeout(() => setGespeichert(false), 2000);
  }

  return (
    <div>
      <p className="mb-3 text-sm text-gray-600">
        Tuercode der Halle je Wochentag. Nach jeder bestaetigten Buchung wird dem Kunden
        automatisch der Code passend zum Buchungstag mitgeteilt. Samstag und Sonntag teilen sich
        einen Code.
      </p>
      <div className="space-y-2">
        {WOCHENTAGE.map((tag) => (
          <label key={tag} className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{WOCHENTAG_LABEL[tag]}</span>
            <input
              value={werte[tag] ?? ""}
              onChange={(e) => setWerte({ ...werte, [tag]: e.target.value })}
              inputMode="numeric"
              placeholder="Code"
              className="w-36 rounded border border-gray-300 px-3 py-2 text-right tracking-widest"
            />
          </label>
        ))}
      </div>
      <button
        onClick={speichern}
        className="mt-4 rounded bg-verein-blau px-4 py-2 font-semibold text-white"
      >
        Speichern
      </button>
      {gespeichert && <span className="ml-3 text-sm text-green-700">Gespeichert.</span>}
    </div>
  );
}

function Tab({
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
      className={`rounded-full px-4 py-2 text-sm font-medium ${
        aktiv ? "bg-verein-blau text-white" : "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}
