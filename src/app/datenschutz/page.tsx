import { VEREIN, config } from "@/lib/config";

export const metadata = { title: "Datenschutz – TC Frankenau" };

export default function DatenschutzPage() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1 className="text-2xl font-bold text-verein-blau">Datenschutzerklaerung</h1>
      <p className="text-sm text-gray-500">
        Diese Erklaerung gilt ausschliesslich fuer die Datenverarbeitung in diesem
        Online-Buchungssystem fuer die Tennishalle. Informationen zur allgemeinen Vereinswebsite
        (z.&nbsp;B. Cookies, Google Maps, Instagram) finden Sie in der separaten
        Datenschutzerklaerung unter{" "}
        <a className="text-verein-blau underline" href={VEREIN.website} target="_blank">
          tennis-frankenau.de
        </a>
        .
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Welche Daten werden erhoben?</h2>
      <p>
        Fuer die Platzbuchung speichern wir ausschliesslich die notwendigen Daten: Ihren Namen und
        einen Kontaktweg (E-Mail-Adresse oder Handynummer) sowie die Buchungsdetails (Platz, Datum,
        Uhrzeit, gewaehlte Ausstattung, Preis).
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Zweck der Verarbeitung</h2>
      <p>
        Die Daten dienen ausschliesslich der Abwicklung Ihrer Buchung (Bestaetigungscode,
        Buchungsbestaetigung, Stornierung) sowie der Organisation des Hallenbetriebs.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Speicherdauer</h2>
      <p>
        Buchungsdaten werden automatisch nach {config.datenLoeschTage} Tagen geloescht.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Verantwortlicher</h2>
      <p>
        {VEREIN.name}, {VEREIN.vereinsanschrift}
        <br />
        Vorsitzender: {VEREIN.vorsitzender}
        <br />
        Telefon: {VEREIN.vereinsanschriftTelefon}. E-Mail: {VEREIN.email}.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung und Loeschung Ihrer Daten. Wenden Sie sich
        dazu an {VEREIN.email}.
      </p>
    </div>
  );
}
