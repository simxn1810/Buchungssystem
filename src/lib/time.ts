import { config, ZEITZONE } from "./config";

export const SLOT_MINUTEN = 15;

// "HH:MM" -> Minuten seit Mitternacht
export function zeitTomin(zeit: string): number {
  const [h, m] = zeit.split(":").map(Number);
  return h * 60 + m;
}

// Minuten seit Mitternacht -> "HH:MM"
export function minToZeit(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Alle buchbaren 15-Minuten-Startslots innerhalb der Öffnungszeiten.
// Beispiel 07:00-23:00 -> 07:00, 07:15, ... 22:45 (letzter Slot endet 23:00).
export function alleSlots(): string[] {
  const von = zeitTomin(config.oeffnungVon);
  const bis = zeitTomin(config.oeffnungBis);
  const slots: string[] = [];
  for (let t = von; t + SLOT_MINUTEN <= bis; t += SLOT_MINUTEN) {
    slots.push(minToZeit(t));
  }
  return slots;
}

// Slots, die eine Buchung mit Startzeit + Dauer belegt.
export function slotsFuerBuchung(startzeit: string, dauerMinuten: number): string[] {
  const start = zeitTomin(startzeit);
  const anzahl = dauerMinuten / SLOT_MINUTEN;
  const slots: string[] = [];
  for (let i = 0; i < anzahl; i++) {
    slots.push(minToZeit(start + i * SLOT_MINUTEN));
  }
  return slots;
}

// Liegt Start + Dauer komplett innerhalb der Öffnungszeiten?
export function innerhalbOeffnung(startzeit: string, dauerMinuten: number): boolean {
  const start = zeitTomin(startzeit);
  const ende = start + dauerMinuten;
  return start >= zeitTomin(config.oeffnungVon) && ende <= zeitTomin(config.oeffnungBis);
}

// Aktuelle Datum-/Zeit-Bestandteile in der Vereins-Zeitzone.
export function jetztInBerlin(): { datum: string; minuten: number } {
  const fmt = new Intl.DateTimeFormat("de-DE", {
    timeZone: ZEITZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const datum = `${get("year")}-${get("month")}-${get("day")}`;
  // "24" als Stunde kann bei Mitternacht auftreten -> auf 00 normalisieren
  const stunde = get("hour") === "24" ? 0 : Number(get("hour"));
  const minuten = stunde * 60 + Number(get("minute"));
  return { datum, minuten };
}

// Heutiges Datum "YYYY-MM-DD" in der Vereins-Zeitzone.
export function heuteISO(): string {
  return jetztInBerlin().datum;
}

// Liegt ein konkreter Slot (datum + startzeit) in der Vergangenheit?
export function istVergangen(datum: string, slot: string): boolean {
  const jetzt = jetztInBerlin();
  if (datum < jetzt.datum) return true;
  if (datum > jetzt.datum) return false;
  return zeitTomin(slot) <= jetzt.minuten;
}

// Datum n Tage nach heute als "YYYY-MM-DD".
export function datumPlusTage(tage: number): string {
  const heute = heuteISO();
  const [y, m, d] = heute.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + tage);
  return dt.toISOString().slice(0, 10);
}

// Ist das Datum innerhalb des buchbaren Horizonts (heute bis max. Horizont)?
export function imBuchungshorizont(datum: string): boolean {
  const heute = heuteISO();
  const max = datumPlusTage(config.buchungHorizontTage);
  return datum >= heute && datum <= max;
}

// Wochentag-Gruppe für Preis/Tarif: "werktags" (Mo-Fr) oder "wochenende" (Sa/So).
export function wochentagGruppe(datum: string): "werktags" | "wochenende" {
  const [y, m, d] = datum.split("-").map(Number);
  const tag = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=So ... 6=Sa
  return tag === 0 || tag === 6 ? "wochenende" : "werktags";
}

// Wochentag als Zahl (0=So ... 6=Sa, analog JS getUTCDay). Wird für Abos genutzt.
export function wochentagNummer(datum: string): number {
  const [y, m, d] = datum.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// Montag (ISO-Wochenstart) der Woche, in der das Datum liegt, als "YYYY-MM-DD".
export function montagDerWoche(datum: string): string {
  const [y, m, d] = datum.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const tag = dt.getUTCDay(); // 0=So ... 6=Sa
  const diff = tag === 0 ? -6 : 1 - tag; // zurück auf Montag
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

// Datum n Tage nach dem angegebenen Datum als "YYYY-MM-DD".
export function datumPlusTageAb(datum: string, tage: number): string {
  const [y, m, d] = datum.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + tage);
  return dt.toISOString().slice(0, 10);
}

// Wochentag-Schlüssel für den Zugangscode der Halle.
// Mo-Fr sowie Sa und So jeweils einzeln.
export type WochentagKey =
  | "montag"
  | "dienstag"
  | "mittwoch"
  | "donnerstag"
  | "freitag"
  | "samstag"
  | "sonntag";

export function wochentagKey(datum: string): WochentagKey {
  const [y, m, d] = datum.split("-").map(Number);
  const tag = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=So ... 6=Sa
  const map: Record<number, WochentagKey> = {
    1: "montag",
    2: "dienstag",
    3: "mittwoch",
    4: "donnerstag",
    5: "freitag",
    6: "samstag",
    0: "sonntag",
  };
  return map[tag];
}

// Deutsche Datumsformatierung, z. B. "Mo., 19.06.2026".
export function formatDatum(datum: string): string {
  const [y, m, d] = datum.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dt);
}
