import { prisma } from "./prisma";
import { config } from "./config";
import {
  slotsFuerBuchung,
  innerhalbOeffnung,
  imBuchungshorizont,
  istVergangen,
  heuteISO,
  SLOT_MINUTEN,
} from "./time";
import { aufraeumenAbgelaufen, slotsFrei } from "./availability";
import { berechnePreisFuerBuchung } from "./pricing";
import { erzeugeCode, erzeugeStornoToken } from "./code";
import { erkenneKontaktTyp, telefonNormalisieren } from "./validate";
import { sendeCode, sendeBestaetigung } from "./notify";
import { zugangscodeFuerDatum } from "./zugangscode";

export type ErstellenInput = {
  platzId: number;
  datum: string;
  startzeit: string;
  dauerMinuten: number;
  name: string;
  kontakt: string;
  mitglied: boolean;
  leihschlaegerAnzahl: number;
  baelle: boolean;
  ermaessigung: boolean;
  einwilligung: boolean;
};

export type LogikErgebnis<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; fehler: string };

// Erstellt eine vorläufige Buchung (Status "ausstehend"), reserviert alle
// benötigten 15-Min-Slots und verschickt den Bestätigungscode.
export async function erstelleVorlaeufigeBuchung(
  input: ErstellenInput
): Promise<LogikErgebnis<{ buchungId: number; kontaktTyp: "email" | "telefon" }>> {
  // --- Eingabevalidierung ---
  if (!input.name || input.name.trim().length < 2) {
    return { ok: false, fehler: "Bitte einen Namen angeben." };
  }
  if (!input.einwilligung) {
    return { ok: false, fehler: "Bitte der Datenschutzerklärung zustimmen." };
  }
  const kontaktTyp = erkenneKontaktTyp(input.kontakt);
  if (!kontaktTyp) {
    return { ok: false, fehler: "Bitte eine gültige E-Mail-Adresse oder Handynummer angeben." };
  }
  // SMS nur, wenn ein Provider konfiguriert ist – sonst nur E-Mail.
  const smsKonfiguriert = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
  if (kontaktTyp === "telefon" && !smsKonfiguriert) {
    return {
      ok: false,
      fehler: "SMS-Versand ist derzeit nicht verfügbar. Bitte eine E-Mail-Adresse angeben.",
    };
  }

  if (
    !Number.isInteger(input.dauerMinuten) ||
    input.dauerMinuten % SLOT_MINUTEN !== 0 ||
    input.dauerMinuten < config.minDauerMinuten ||
    input.dauerMinuten > config.maxDauerMinuten
  ) {
    return {
      ok: false,
      fehler: `Die Dauer muss zwischen ${config.minDauerMinuten} und ${config.maxDauerMinuten} Minuten liegen (in 15-Minuten-Schritten).`,
    };
  }
  if (!innerhalbOeffnung(input.startzeit, input.dauerMinuten)) {
    return { ok: false, fehler: "Die gewählte Zeit liegt außerhalb der Öffnungszeiten." };
  }
  if (!imBuchungshorizont(input.datum)) {
    return { ok: false, fehler: "Das Datum liegt außerhalb des buchbaren Zeitraums." };
  }
  if (istVergangen(input.datum, input.startzeit)) {
    return { ok: false, fehler: "Die gewählte Zeit liegt in der Vergangenheit." };
  }
  if (
    !Number.isInteger(input.leihschlaegerAnzahl) ||
    input.leihschlaegerAnzahl < 0 ||
    input.leihschlaegerAnzahl > 10
  ) {
    return { ok: false, fehler: "Ungültige Anzahl Leihschläger." };
  }

  const platz = await prisma.platz.findUnique({ where: { id: input.platzId } });
  if (!platz || !platz.aktiv) {
    return { ok: false, fehler: "Platz nicht verfügbar." };
  }

  const slots = slotsFuerBuchung(input.startzeit, input.dauerMinuten);

  await aufraeumenAbgelaufen();
  if (!(await slotsFrei(input.platzId, input.datum, slots))) {
    return { ok: false, fehler: "Dieser Platz ist zu dieser Zeit leider nicht mehr verfügbar." };
  }

  // --- Preis berechnen ---
  let gesamtpreisCent: number;
  try {
    const preis = await berechnePreisFuerBuchung({
      platzId: input.platzId,
      datum: input.datum,
      startzeit: input.startzeit,
      dauerMinuten: input.dauerMinuten,
      mitglied: input.mitglied,
      leihschlaegerAnzahl: input.leihschlaegerAnzahl,
      baelle: input.baelle,
      ermaessigung: input.ermaessigung,
    });
    gesamtpreisCent = preis.gesamtCent;
  } catch {
    return {
      ok: false,
      fehler: "Für diese Zeit ist kein Tarif hinterlegt. Bitte den Verein kontaktieren.",
    };
  }

  const kontaktGespeichert =
    kontaktTyp === "telefon" ? telefonNormalisieren(input.kontakt) : input.kontakt.trim();
  const code = erzeugeCode();
  const codeAblauf = new Date(Date.now() + config.codeGueltigMinuten * 60_000);

  // --- Buchung + Belegungen in einer Transaktion anlegen ---
  // Die Unique-Constraint auf (platzId, datum, slot) verhindert Doppelbuchung.
  let buchungId: number;
  try {
    const buchung = await prisma.$transaction(async (tx) => {
      const b = await tx.buchung.create({
        data: {
          platzId: input.platzId,
          datum: input.datum,
          startzeit: input.startzeit,
          dauerMinuten: input.dauerMinuten,
          name: input.name.trim(),
          kontakt: kontaktGespeichert,
          kontaktTyp,
          mitglied: input.mitglied,
          leihschlaegerAnzahl: input.leihschlaegerAnzahl,
          baelle: input.baelle,
          ermaessigung: input.ermaessigung,
          gesamtpreisCent,
          status: "ausstehend",
          code,
          codeAblauf,
          stornoToken: erzeugeStornoToken(),
        },
      });
      await tx.belegung.createMany({
        data: slots.map((slot) => ({
          buchungId: b.id,
          platzId: input.platzId,
          datum: input.datum,
          slot,
        })),
      });
      return b;
    });
    buchungId = buchung.id;
  } catch {
    // Verletzung der Unique-Constraint = paralleler Zugriff hat den Slot belegt.
    return { ok: false, fehler: "Dieser Platz ist zu dieser Zeit leider nicht mehr verfügbar." };
  }

  // --- Code versenden ---
  try {
    await sendeCode(kontaktGespeichert, kontaktTyp, code, config.codeGueltigMinuten);
  } catch {
    // Versand fehlgeschlagen -> Reservierung wieder freigeben.
    await prisma.belegung.deleteMany({ where: { buchungId } });
    await prisma.buchung.update({ where: { id: buchungId }, data: { status: "storniert" } });
    return { ok: false, fehler: "Der Bestätigungscode konnte nicht versendet werden. Bitte erneut versuchen." };
  }

  return { ok: true, data: { buchungId, kontaktTyp } };
}

export type BestaetigungAnzeige = {
  platzName: string;
  datum: string;
  startzeit: string;
  dauerMinuten: number;
  leihschlaegerAnzahl: number;
  baelle: boolean;
  gesamtpreisCent: number;
  stornoToken: string;
};

// Bestätigt eine Buchung anhand des Codes.
export async function bestaetigeBuchung(
  buchungId: number,
  code: string,
  baseUrl: string
): Promise<LogikErgebnis<BestaetigungAnzeige>> {
  const buchung = await prisma.buchung.findUnique({
    where: { id: buchungId },
    include: { platz: true },
  });
  if (!buchung) return { ok: false, fehler: "Buchung nicht gefunden." };

  if (buchung.status === "bestaetigt") {
    return {
      ok: true,
      data: {
        platzName: buchung.platz.name,
        datum: buchung.datum,
        startzeit: buchung.startzeit,
        dauerMinuten: buchung.dauerMinuten,
        leihschlaegerAnzahl: buchung.leihschlaegerAnzahl,
        baelle: buchung.baelle,
        gesamtpreisCent: buchung.gesamtpreisCent,
        stornoToken: buchung.stornoToken,
      },
    };
  }
  if (buchung.status !== "ausstehend") {
    return { ok: false, fehler: "Diese Buchung ist nicht mehr gültig." };
  }
  if (!buchung.codeAblauf || buchung.codeAblauf.getTime() < Date.now()) {
    await aufraeumenAbgelaufen();
    return { ok: false, fehler: "Der Code ist abgelaufen. Bitte buchen Sie erneut." };
  }
  if (buchung.code !== code.trim()) {
    return { ok: false, fehler: "Der Code ist falsch." };
  }

  // Neuen Storno-Token erzeugen, Code entfernen, Status auf bestätigt.
  const stornoToken = erzeugeStornoToken();
  await prisma.buchung.update({
    where: { id: buchungId },
    data: { status: "bestaetigt", code: null, codeAblauf: null, stornoToken },
  });

  const stornoUrl = `${baseUrl}/stornieren/${stornoToken}`;
  const zugangscode = await zugangscodeFuerDatum(buchung.datum);
  try {
    await sendeBestaetigung(buchung.kontakt, buchung.kontaktTyp as "email" | "telefon", {
      platzName: buchung.platz.name,
      datum: buchung.datum,
      startzeit: buchung.startzeit,
      dauerMinuten: buchung.dauerMinuten,
      leihschlaegerAnzahl: buchung.leihschlaegerAnzahl,
      baelle: buchung.baelle,
      gesamtpreisCent: buchung.gesamtpreisCent,
      stornoUrl,
      zugangscode,
    });
  } catch {
    // Bestätigung steht trotzdem; Versandfehler nicht hart abbrechen.
  }

  return {
    ok: true,
    data: {
      platzName: buchung.platz.name,
      datum: buchung.datum,
      startzeit: buchung.startzeit,
      dauerMinuten: buchung.dauerMinuten,
      leihschlaegerAnzahl: buchung.leihschlaegerAnzahl,
      baelle: buchung.baelle,
      gesamtpreisCent: buchung.gesamtpreisCent,
      stornoToken,
    },
  };
}

// Storniert eine bestätigte Buchung – nur mit gültigem Token möglich.
export async function storniereMitToken(token: string): Promise<LogikErgebnis> {
  if (!token) return { ok: false, fehler: "Ungültiger Stornolink." };
  const buchung = await prisma.buchung.findUnique({ where: { stornoToken: token } });
  if (!buchung || buchung.status !== "bestaetigt") {
    return { ok: false, fehler: "Buchung nicht gefunden oder bereits storniert." };
  }
  await prisma.$transaction([
    prisma.belegung.deleteMany({ where: { buchungId: buchung.id } }),
    prisma.buchung.update({ where: { id: buchung.id }, data: { status: "storniert" } }),
  ]);
  return { ok: true, data: undefined };
}

export type MeineBuchung = {
  id: number;
  platzName: string;
  datum: string;
  startzeit: string;
  dauerMinuten: number;
  gesamtpreisCent: number;
  leihschlaegerAnzahl: number;
  baelle: boolean;
};

// Findet kommende, bestätigte Buchungen anhand von Name + E-Mail.
// Es müssen sowohl Name als auch E-Mail (jeweils unabhängig von Groß-/
// Kleinschreibung) übereinstimmen, damit fremde Buchungen nicht einsehbar sind.
export async function findeBuchungenFuerKontakt(
  name: string,
  email: string
): Promise<MeineBuchung[]> {
  const e = email.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  if (!e || !n) return [];

  const buchungen = await prisma.buchung.findMany({
    where: { status: "bestaetigt", kontaktTyp: "email", datum: { gte: heuteISO() } },
    orderBy: [{ datum: "asc" }, { startzeit: "asc" }],
    include: { platz: { select: { name: true } } },
  });

  // Vergleich case-insensitiv in JS (SQLite kennt kein mode:"insensitive").
  return buchungen
    .filter(
      (b) => b.kontakt.trim().toLowerCase() === e && b.name.trim().toLowerCase() === n
    )
    .map((b) => ({
      id: b.id,
      platzName: b.platz.name,
      datum: b.datum,
      startzeit: b.startzeit,
      dauerMinuten: b.dauerMinuten,
      gesamtpreisCent: b.gesamtpreisCent,
      leihschlaegerAnzahl: b.leihschlaegerAnzahl,
      baelle: b.baelle,
    }));
}

// Storniert eine bestätigte Buchung anhand der ID, abgesichert durch erneute
// Prüfung von Name + E-Mail (verhindert Stornierung fremder Buchungen).
export async function storniereMitKontakt(
  buchungId: number,
  name: string,
  email: string
): Promise<LogikErgebnis> {
  const b = await prisma.buchung.findUnique({ where: { id: buchungId } });
  if (!b || b.status !== "bestaetigt") {
    return { ok: false, fehler: "Buchung nicht gefunden oder bereits storniert." };
  }
  const passt =
    b.kontaktTyp === "email" &&
    b.kontakt.trim().toLowerCase() === email.trim().toLowerCase() &&
    b.name.trim().toLowerCase() === name.trim().toLowerCase();
  if (!passt) {
    return { ok: false, fehler: "Buchung nicht gefunden oder bereits storniert." };
  }
  await prisma.$transaction([
    prisma.belegung.deleteMany({ where: { buchungId: b.id } }),
    prisma.buchung.update({ where: { id: b.id }, data: { status: "storniert" } }),
  ]);
  return { ok: true, data: undefined };
}
