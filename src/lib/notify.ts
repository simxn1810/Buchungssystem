import { sendeEmail } from "./email";
import { sendeSms, smsAktiv } from "./sms";
import { formatEuro } from "./pricing";
import { formatDatum } from "./time";
import { VEREIN } from "./config";
import type { KontaktTyp } from "./validate";

// Versand des Bestaetigungscodes ueber den gewaehlten Kanal.
export async function sendeCode(
  kontakt: string,
  kontaktTyp: KontaktTyp,
  code: string,
  gueltigMinuten: number
): Promise<void> {
  const text =
    `Ihr Bestaetigungscode fuer die Platzbuchung beim ${VEREIN.name} lautet: ${code}\n` +
    `Bitte geben Sie den Code innerhalb von ${gueltigMinuten} Minuten ein, ` +
    `sonst wird die Reservierung wieder freigegeben.`;

  if (kontaktTyp === "telefon") {
    await sendeSms({ to: kontakt, text });
  } else {
    await sendeEmail({
      to: kontakt,
      subject: `Bestaetigungscode ${code} – ${VEREIN.name}`,
      text,
    });
  }
}

export type BuchungBestaetigungDaten = {
  platzName: string;
  datum: string;
  startzeit: string;
  dauerMinuten: number;
  leihschlaegerAnzahl: number;
  baelle: boolean;
  gesamtpreisCent: number;
  stornoUrl: string;
  zugangscode: string | null;
};

function bestaetigungText(d: BuchungBestaetigungDaten): string {
  const endeMin =
    Number(d.startzeit.split(":")[0]) * 60 +
    Number(d.startzeit.split(":")[1]) +
    d.dauerMinuten;
  const ende = `${String(Math.floor(endeMin / 60)).padStart(2, "0")}:${String(
    endeMin % 60
  ).padStart(2, "0")}`;

  const zeilen = [
    `Ihre Buchung beim ${VEREIN.name} ist bestaetigt.`,
    "",
    `Platz: ${d.platzName}`,
    `Datum: ${formatDatum(d.datum)}`,
    `Uhrzeit: ${d.startzeit} – ${ende} Uhr (${d.dauerMinuten} Min)`,
    `Leihschlaeger: ${d.leihschlaegerAnzahl > 0 ? d.leihschlaegerAnzahl : "keine"}`,
    `Baelle: ${d.baelle ? "ja" : "nein"}`,
    "",
    `Vor Ort zu zahlen: ${formatEuro(d.gesamtpreisCent)} €`,
    "Die Bezahlung erfolgt vor Ort.",
    "",
    ...(d.zugangscode
      ? [
          `Zugangscode fuer die Halle an diesem Tag: ${d.zugangscode}`,
          "Bitte nicht weitergeben. Der Code gilt nur fuer den Buchungstag.",
          "",
        ]
      : []),
    `Stornieren: ${d.stornoUrl}`,
    "",
    `Adresse: ${VEREIN.adresse} (${VEREIN.naviHinweis})`,
    "",
    "Bitte denken Sie nach dem Spiel daran, die Fenster zu schliessen und das Licht auszuschalten. Vielen Dank!",
  ];
  return zeilen.join("\n");
}

export async function sendeBestaetigung(
  kontakt: string,
  kontaktTyp: KontaktTyp,
  d: BuchungBestaetigungDaten
): Promise<void> {
  const text = bestaetigungText(d);
  if (kontaktTyp === "telefon") {
    await sendeSms({ to: kontakt, text });
  } else {
    await sendeEmail({
      to: kontakt,
      subject: `Buchungsbestaetigung – ${VEREIN.name}`,
      text,
    });
  }
}

export { smsAktiv };
