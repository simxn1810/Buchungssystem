import { VEREIN } from "@/lib/config";

export const metadata = { title: "Kontakt – TC Frankenau" };

export default function KontaktPage() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1 className="text-2xl font-bold text-verein-blau">Kontakt</h1>
      <p className="font-semibold">{VEREIN.name}</p>
      <p>
        Halle/Adresse: {VEREIN.adresse}
        <br />
        {VEREIN.naviHinweis}
      </p>
      <p>Vorsitzender: {VEREIN.vorsitzender}</p>
      <p>
        E-Mail:{" "}
        <a className="text-verein-blau underline" href={`mailto:${VEREIN.email}`}>
          {VEREIN.email}
        </a>
      </p>
      <p>Telefon Vorsitzender: {VEREIN.telefon}</p>
      <p>WhatsApp: {VEREIN.whatsapp}</p>
      <p>Instagram: {VEREIN.instagram}</p>
      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Die Halle</h2>
      <p>
        Zwei beheizte Tennisplaetze und ein Squashplatz. Umkleidekabinen, Duschen und Parkplaetze
        direkt vor dem Gebaeude. Schlaegerleihe: 1,- € / Stunde / Schlaeger.
      </p>
    </div>
  );
}
