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

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Rechtsgrundlage</h2>
      <p>
        Die Verarbeitung erfolgt zur Erfuellung eines Vertrags bzw. zur Durchfuehrung
        vorvertraglicher Massnahmen (Art. 6 Abs. 1 lit. b DSGVO), naemlich der Bereitstellung des
        gebuchten Hallenplatzes.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Empfaenger / Auftragsverarbeiter</h2>
      <p>
        Zur technischen Bereitstellung dieses Buchungssystems werden folgende Dienstleister als
        Auftragsverarbeiter eingesetzt:
      </p>
      <ul>
        <li>Vercel Inc. (USA) – Hosting der Anwendung</li>
        <li>Neon (PostgreSQL-Datenbank) – Speicherung der Buchungsdaten</li>
        <li>Resend bzw. ein SMTP-Anbieter – Versand von Bestaetigungs-E-Mails</li>
        <li>Twilio Inc. (USA) – Versand von SMS-Bestaetigungscodes, sofern per Handynummer gebucht wird</li>
      </ul>
      <p>
        Bei Anbietern mit Sitz in den USA erfolgt die Datenuebertragung auf Grundlage von
        EU-Standardvertragsklauseln. Eine Weitergabe an sonstige Dritte findet nicht statt.
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
        Sie haben das Recht auf Auskunft, Berichtigung, Loeschung und Einschraenkung der
        Verarbeitung Ihrer Daten sowie das Recht auf Datenuebertragbarkeit und Widerspruch gegen
        die Verarbeitung. Wenden Sie sich dazu an {VEREIN.email}. Ausserdem steht Ihnen ein
        Beschwerderecht bei der zustaendigen Datenschutz-Aufsichtsbehoerde zu.
      </p>
    </div>
  );
}
