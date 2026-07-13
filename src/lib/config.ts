// Zentrale Konfiguration. Werte aus Umgebungsvariablen mit sinnvollen Defaults.

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(name: string, fallback: string): string {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
}

function bool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return v.toLowerCase() === "true" || v === "1";
}

export const config = {
  oeffnungVon: str("OEFFNUNG_VON", "07:00"),
  oeffnungBis: str("OEFFNUNG_BIS", "23:00"),
  minDauerMinuten: num("MIN_DAUER_MINUTEN", 30),
  maxDauerMinuten: num("MAX_DAUER_MINUTEN", 180),
  buchungHorizontTage: num("BUCHUNG_HORIZONT_TAGE", 62),
  codeGueltigMinuten: num("CODE_GUELTIG_MINUTEN", 10),
  datenLoeschTage: num("DATEN_LOESCH_TAGE", 60),
  mitgliedAuswahlAktiv: bool("MITGLIED_AUSWAHL_AKTIV", false),
  leihschlaegerCentProStunde: num("LEIHSCHLAEGER_CENT_PRO_STUNDE", 100),
  ballPreisCent: num("BALL_PREIS_CENT", 0),
  ermaessigungCentProStunde: num("ERMAESSIGUNG_CENT_PRO_STUNDE", 200),
  mitgliedRabattCentProStunde: num("MITGLIED_RABATT_CENT_PRO_STUNDE", 200),
  adminPasswort: str("ADMIN_PASSWORD", ""),
};

// Zeitzone fuer Datums-/Verfuegbarkeitslogik. Frankenau liegt in Deutschland.
export const ZEITZONE = "Europe/Berlin";

// Vereinsdaten (fest hinterlegt fuer Footer, Kontakt, Bestaetigungen).
export const VEREIN = {
  name: "Tennisclub Frankenau 1978 e.V.",
  // Physischer Standort der Tennishalle (fuer Anfahrt/Footer).
  adresse: "Am Sternberg 3, 35110 Frankenau",
  naviHinweis: "Navi: Am Sternberg 1d",
  vorsitzender: "Uwe Eimer",
  email: "kontakt@tennis-frankenau.de",
  telefon: "01578 5533988",
  whatsapp: "+49 159 01233300",
  instagram: "@tcfrankenau",
  website: "https://tennis-frankenau.de",
  steuernummer: "1125000474 (Finanzamt Korbach-Frankenberg)",
  // Rechtliche Vereinsanschrift gemaess offiziellem Impressum (§ 5 TMG/DDG) – weicht vom
  // physischen Standort der Tennishalle ab.
  vereinsanschrift: "Schulstraße 15, 35110 Frankenau",
  // Telefonnummer, wie sie auf der Vereinswebsite fuer die "verantwortliche Stelle" genannt wird.
  vereinsanschriftTelefon: "06451/22756",
  vorsitzenderAdresse: "Wildungerstraße 36, 35066 Frankenberg (Eder) OT Geismar",
  webmaster: "Lasse Kahler, Simon Battefeld, Jan Stachon (Vorstand)",
};
