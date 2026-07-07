"use client";

import { useCallback, useEffect, useState } from "react";

type Platz = { id: number; name: string; typ: string };
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
type Abo = {
  id: number;
  platzId: number;
  platz: { name: string };
  wochentag: number;
  zeitVon: string;
  zeitBis: string;
  datumVon: string;
  datumBis: string;
  titel: string;
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
  const [tab, setTab] = useState<
    "buchungen" | "sperrungen" | "abos" | "tarife" | "zugangscodes"
  >("buchungen");

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

      <div className="mb-4 flex flex-wrap gap-2">
        <Tab aktiv={tab === "buchungen"} onClick={() => setTab("buchungen")} label="Buchungen" />
        <Tab aktiv={tab === "sperrungen"} onClick={() => setTab("sperrungen")} label="Sperrzeiten" />
        <Tab aktiv={tab === "abos"} onClick={() => setTab("abos")} label="Abos" />
        <Tab aktiv={tab === "tarife"} onClick={() => setTab("tarife")} label="Tarife" />
        <Tab
          aktiv={tab === "zugangscodes"}
          onClick={() => setTab("zugangscodes")}
          label="Zugangscodes"
        />
      </div>

      {tab === "buchungen" && <BuchungenTab heute={heute} />}
      {tab === "sperrungen" && <SperrungenTab plaetze={plaetze} heute={heute} />}
      {tab === "abos" && <AbosTab plaetze={plaetze} heute={heute} />}
      {tab === "tarife" && <TarifeTab />}
      {tab === "zugangscodes" && <ZugangscodesTab />}
    </div>
  );
}

function BuchungenTab({ heute }: { heute: string }) {
  const [modus, setModus] = useState<"tag" | "alle">("tag");
  const [datum, setDatum] = useState(heute);
  const [buchungen, setBuchungen] = useState<Buchung[]>([]);
  const [lade, setLade] = useState(false);

  const laden = useCallback(async () => {
    setLade(true);
    const url = modus === "alle" ? "/api/admin/buchungen" : `/api/admin/buchungen?datum=${datum}`;
    const res = await fetch(url);
    const json = await res.json();
    setBuchungen(json.buchungen || []);
    setLade(false);
  }, [datum, modus]);

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
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setModus("tag")}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            modus === "tag" ? "bg-verein-blau text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Ein Tag
        </button>
        <button
          onClick={() => setModus("alle")}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            modus === "alle" ? "bg-verein-blau text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Alle Buchungen
        </button>
      </div>

      {modus === "tag" && (
        <label className="mb-4 block">
          <span className="text-sm font-medium">Tag</span>
          <input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
      )}

      {lade ? (
        <p className="text-gray-500">Lade…</p>
      ) : buchungen.length === 0 ? (
        <p className="text-gray-500">
          {modus === "alle" ? "Keine Buchungen vorhanden." : "Keine Buchungen an diesem Tag."}
        </p>
      ) : (
        <ul className="space-y-2">
          {buchungen.map((b) => (
            <li key={b.id} className="rounded border border-gray-200 p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">
                  {modus === "alle" && `${datumDe(b.datum)} · `}
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

  const tennisIds = plaetze.filter((p) => p.typ === "tennis").map((p) => p.id);

  async function anlegen() {
    setFehler(null);
    const body: Record<string, unknown> = { datum, von, bis, grund };
    if (platzId === "tennis-alle") {
      body.platzIds = tennisIds;
    } else {
      body.platzId = platzId === "" ? null : Number(platzId);
    }
    const res = await fetch("/api/admin/sperrungen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
            {tennisIds.length >= 2 && (
              <option value="tennis-alle">Beide Tennisplaetze</option>
            )}
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
            {tarife.filter((t) => !t.mitglied).map((t) => (
              <tr key={t.id} className="border-t border-gray-100">
                <td className="p-1">{t.sportart}</td>
                <td className="p-1">{t.saison}</td>
                <td className="p-1">Gast</td>
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

// Wochentage als (Nummer analog getUTCDay, Label) – Reihenfolge Mo..So.
const ABO_WOCHENTAGE: { nummer: number; label: string }[] = [
  { nummer: 1, label: "Montag" },
  { nummer: 2, label: "Dienstag" },
  { nummer: 3, label: "Mittwoch" },
  { nummer: 4, label: "Donnerstag" },
  { nummer: 5, label: "Freitag" },
  { nummer: 6, label: "Samstag" },
  { nummer: 0, label: "Sonntag" },
];
function wochentagLabel(n: number): string {
  return ABO_WOCHENTAGE.find((w) => w.nummer === n)?.label ?? "?";
}
function datumDe(d: string): string {
  const [y, m, dd] = d.split("-");
  return `${dd}.${m}.${y}`;
}

function AbosTab({ plaetze, heute }: { plaetze: Platz[]; heute: string }) {
  const [platzId, setPlatzId] = useState<string>(plaetze[0] ? String(plaetze[0].id) : "");
  const [wochentag, setWochentag] = useState<string>("2"); // Dienstag als Beispiel
  const [von, setVon] = useState("19:00");
  const [bis, setBis] = useState("20:00");
  const [datumVon, setDatumVon] = useState(heute);
  const [datumBis, setDatumBis] = useState(heute);
  const [titel, setTitel] = useState("");
  const [abos, setAbos] = useState<Abo[]>([]);
  const [fehler, setFehler] = useState<string | null>(null);

  const laden = useCallback(async () => {
    const res = await fetch("/api/admin/abos");
    const json = await res.json();
    setAbos(json.abos || []);
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  async function anlegen() {
    setFehler(null);
    const res = await fetch("/api/admin/abos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platzId: Number(platzId),
        wochentag: Number(wochentag),
        zeitVon: von,
        zeitBis: bis,
        datumVon,
        datumBis,
        titel,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFehler(json.fehler || "Fehler beim Anlegen.");
      return;
    }
    setTitel("");
    laden();
  }

  async function loeschen(id: number) {
    if (!confirm("Dieses Abo wirklich loeschen?")) return;
    await fetch(`/api/admin/abos?id=${id}`, { method: "DELETE" });
    laden();
  }

  return (
    <div>
      <div className="mb-4 rounded border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold text-verein-blau">Abo anlegen</h2>
        <p className="mb-3 text-sm text-gray-600">
          Reserviert einen Platz an einem festen Wochentag in einem Zeitfenster ueber einen
          Zeitraum (z. B. jeden Dienstag 19–20 Uhr). Die Zeit ist fuer diesen Zeitraum nicht
          buchbar.
        </p>
        <label className="mb-2 block">
          <span className="text-sm">Platz</span>
          <select
            value={platzId}
            onChange={(e) => setPlatzId(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          >
            {plaetze.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="mb-2 block">
          <span className="text-sm">Wochentag</span>
          <select
            value={wochentag}
            onChange={(e) => setWochentag(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          >
            {ABO_WOCHENTAGE.map((w) => (
              <option key={w.nummer} value={w.nummer}>
                {w.label}
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
        <div className="mb-2 flex gap-2">
          <label className="flex-1">
            <span className="text-sm">Zeitraum von</span>
            <input
              type="date"
              value={datumVon}
              onChange={(e) => setDatumVon(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex-1">
            <span className="text-sm">Zeitraum bis</span>
            <input
              type="date"
              value={datumBis}
              onChange={(e) => setDatumBis(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
        </div>
        <label className="mb-3 block">
          <span className="text-sm">Bezeichnung</span>
          <input
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="z. B. Mannschaftstraining, Dauerbuchung Müller"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
        {fehler && <p className="mb-2 text-sm text-red-600">{fehler}</p>}
        <button
          onClick={anlegen}
          disabled={!titel}
          className="w-full rounded bg-verein-blau px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          Abo anlegen
        </button>
      </div>

      <h2 className="mb-2 font-semibold text-verein-blau">Bestehende Abos</h2>
      {abos.length === 0 ? (
        <p className="text-gray-500">Keine Abos angelegt.</p>
      ) : (
        <ul className="space-y-2">
          {abos.map((a) => (
            <li key={a.id} className="rounded border border-gray-200 p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">
                  {a.platz.name} · {wochentagLabel(a.wochentag)} · {a.zeitVon}–{a.zeitBis}
                </span>
                <button onClick={() => loeschen(a.id)} className="text-xs text-red-600 underline">
                  Loeschen
                </button>
              </div>
              <div className="text-gray-600">{a.titel}</div>
              <div className="text-gray-500">
                {datumDe(a.datumVon)} – {datumDe(a.datumBis)}
              </div>
            </li>
          ))}
        </ul>
      )}
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
