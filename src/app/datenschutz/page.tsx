import { VEREIN, config } from "@/lib/config";

export const metadata = { title: "Datenschutz – TC Frankenau" };

export default function DatenschutzPage() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1 className="text-2xl font-bold text-verein-blau">Datenschutzerklärung</h1>
      <p className="text-sm text-gray-500">
        Diese Erklärung gilt ausschließlich für die Datenverarbeitung in diesem
        Online-Buchungssystem für die Tennishalle. Informationen zur allgemeinen Vereinswebsite
        (z.&nbsp;B. Cookies, Google Maps, Instagram) finden Sie in der separaten
        Datenschutzerklärung unter{" "}
        <a className="text-verein-blau underline" href={VEREIN.website} target="_blank">
          tennis-frankenau.de
        </a>
        .
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Welche Daten werden erhoben?</h2>
      <p>
        Für die Platzbuchung speichern wir ausschließlich die notwendigen Daten: Ihren Namen und
        einen Kontaktweg (E-Mail-Adresse oder Handynummer) sowie die Buchungsdetails (Platz, Datum,
        Uhrzeit, gewählte Ausstattung, Preis).
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Zweck der Verarbeitung</h2>
      <p>
        Die Daten dienen ausschließlich der Abwicklung Ihrer Buchung (Bestätigungscode,
        Buchungsbestätigung, Stornierung) sowie der Organisation des Hallenbetriebs.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Rechtsgrundlage</h2>
      <p>
        Die Verarbeitung erfolgt zur Erfüllung eines Vertrags bzw. zur Durchführung
        vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO), nämlich der Bereitstellung des
        gebuchten Hallenplatzes.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Empfänger / Auftragsverarbeiter</h2>
      <p>
        Zur technischen Bereitstellung dieses Buchungssystems werden folgende Dienstleister als
        Auftragsverarbeiter eingesetzt:
      </p>
      <ul>
        <li>Vercel Inc. (USA) – Hosting der Anwendung</li>
        <li>Neon (PostgreSQL-Datenbank) – Speicherung der Buchungsdaten</li>
        <li>Resend bzw. ein SMTP-Anbieter – Versand von Bestätigungs-E-Mails</li>
        <li>Twilio Inc. (USA) – Versand von SMS-Bestätigungscodes, sofern per Handynummer gebucht wird</li>
      </ul>
      <p>
        Bei Anbietern mit Sitz in den USA erfolgt die Datenübertragung auf Grundlage von
        EU-Standardvertragsklauseln. Eine Weitergabe an sonstige Dritte findet nicht statt.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Speicherdauer</h2>
      <p>
        Buchungsdaten werden automatisch nach {config.datenLoeschTage} Tagen gelöscht.
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
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der
        Verarbeitung Ihrer Daten sowie das Recht auf Datenübertragbarkeit und Widerspruch gegen
        die Verarbeitung. Wenden Sie sich dazu an {VEREIN.email}. Außerdem steht Ihnen ein
        Beschwerderecht bei der zuständigen Datenschutz-Aufsichtsbehörde zu.
      </p>
    </div>
  );
}
